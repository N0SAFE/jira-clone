'use client'

import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useState, useTransition } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import directus from '@/lib/directus'
import { useProject } from '@/context/ProjectContext'
import { Collections } from '@repo/directus-sdk/client'
import { Button } from '@repo/ui/components/shadcn/button'
import { Plus } from 'lucide-react'
import { BoardColumn } from '@/components/molecules/BoardColumn'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/ui/components/shadcn/dialog'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@repo/ui/components/shadcn/form'
import { Input } from '@repo/ui/components/shadcn/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/components/shadcn/select'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import { Board } from '@/components/organisms/Board'

type BoardTicket = {
    id: number
    status: Collections.TicketsStatus['id']
    title: string
    priority: Collections.Tickets['priority']
    description?: string
}

export default function BoardPage() {
    const { data: project } = useProject() ?? {}
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const createTicketSchema = z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        // priorityShouldBeANumber from the project?.priorities list
        priority: z.number().refine(
            (val) => {
                return project?.priorities?.some(
                    (priority) => priority.id === val
                )
            },
            {
                message: 'Priority is required',
            }
        ),
    })

    type CreateTicketForm = z.infer<typeof createTicketSchema>

    const form = useForm<CreateTicketForm>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            priority: project?.priorities?.[0]?.id,
        },
    })

    const updateTicketStatus = useMutation({
        mutationFn: async ({
            id,
            status,
        }: {
            id: Collections.Tickets['id']
            status: Collections.TicketsStatus['id']
        }) => {
            return directus.Ticket.update(id, { status })
        },
        onMutate: async ({ id, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
                queryKey: ['projects', project?.id, 'tickets'],
            })

            // Get the previous state
            const previousTickets = queryClient.getQueryData([
                'projects',
                project?.id,
                'tickets',
            ])

            // Update the cache with optimistic data
            queryClient.setQueryData(
                ['projects', project?.id, 'tickets'],
                (old: BoardTicket[] | undefined) => {
                    if (!old) return []
                    return old.map((ticket) => {
                        if (ticket.id === id) {
                            return {
                                ...ticket,
                                status: status,
                            }
                        }
                        return ticket
                    })
                }
            )

            return { previousTickets }
        },
        onError: (err, variables, context) => {
            // If there's an error, rollback
            if (context?.previousTickets) {
                queryClient.setQueryData(
                    ['projects', project?.id, 'tickets'],
                    context.previousTickets
                )
            }
        },
        onSettled: () => {
            // Always refetch after error or success
            queryClient.invalidateQueries({
                queryKey: ['projects', project?.id, 'tickets'],
            })
        },
    })

    const { data: tickets } = useQuery({
        queryKey: ['projects', project?.id, 'tickets'],
        queryFn: async () => {
            return directus.Tickets.query({
                filter: {
                    project: project?.id,
                },
                fields: ['id', 'title', 'description', {
                    priority: ['color', 'id'],
                    status: ['name', 'color', 'id'],
                }],
            })
        },
        enabled: !!project?.id,
    })

    const createTicket = useMutation({
        mutationFn: async (data: CreateTicketForm) => {
            return directus.Tickets.create([
                {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    project: project?.id,
                    status: project?.statuses?.[0]?.id,
                },
            ])
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['projects', project?.id, 'tickets'],
            })
            setIsDialogOpen(false)
            form.reset()
        },
    })

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || !tickets) {
            return
        }

        const activeId = active.id as number
        const overId = over.id

        // Update the ticket status
        updateTicketStatus.mutate({
            id: activeId,
            status: Number(overId),
        })
    }

    async function onSubmit(data: CreateTicketForm) {
        createTicket.mutate(data)
    }

    if (!project) return null

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Board</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Ticket</DialogTitle>
                            <DialogDescription>
                                Add a new ticket to the board. It will be added
                                to the To Do column.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter ticket title"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter ticket description"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={`${field.value}`}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {project?.priorities?.map(
                                                        (priority) => (
                                                            <SelectItem
                                                                key={
                                                                    priority.id
                                                                }
                                                                value={`${priority.id}`}
                                                            >
                                                                {priority.name
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    priority.name.slice(
                                                                        1
                                                                    )}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={createTicket.isPending}
                                >
                                    {createTicket.isPending
                                        ? 'Creating...'
                                        : 'Create Ticket'}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Board
                tickets={tickets || []}
                onDragEnd={handleDragEnd}
                statuses={project?.statuses || []}
            />
        </div>
    )
}
