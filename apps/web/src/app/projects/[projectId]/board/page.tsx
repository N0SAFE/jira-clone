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

type TicketStatus = 'todo' | 'in-progress' | 'done'

type BoardTicket = {
    id: number
    status: TicketStatus
    title: string
    priority: Collections.Tickets['priority']
    description?: string
}

const createTicketSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'high']),
})

type CreateTicketForm = z.infer<typeof createTicketSchema>

export default function BoardPage() {
    const { data: project } = useProject()
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const form = useForm<CreateTicketForm>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            priority: 'low',
        },
    })

    const updateTicketStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            return directus.Ticket.update(id, {
                status: mapBoardToStatus(status as TicketStatus),
            })
        },
        onMutate: async ({ id, status }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ 
                queryKey: ['projects', project?.id, 'tickets']
            })

            // Get the previous state
            const previousTickets = queryClient.getQueryData(['projects', project?.id, 'tickets'])

            // Update the cache with optimistic data
            queryClient.setQueryData(
                ['projects', project?.id, 'tickets'],
                (old: BoardTicket[] | undefined) => {
                    if (!old) return []
                    return old.map((ticket) => {
                        if (ticket.id === id) {
                            return {
                                ...ticket,
                                status: status as TicketStatus,
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
            const result = await directus.Tickets.query({
                filter: {
                    project: project?.id,
                },
                fields: ['id', 'title', 'status', 'priority', 'description'],
            })
            return (result || []).map((ticket) => ({
                ...ticket,
                status: mapStatusToBoard(ticket.status),
            })) as BoardTicket[]
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
                    status: 'draft', // This will map to 'todo' on the board
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
    
    function mapStatusToBoard(status: string): TicketStatus {
        switch (status) {
            case 'draft':
                return 'todo'
            case 'published':
                return 'in-progress'
            case 'archived':
                return 'done'
            default:
                return 'todo'
        }
    }

    function mapBoardToStatus(status: TicketStatus): Collections.Tickets['status'] {
        switch (status) {
            case 'todo':
                return 'draft'
            case 'in-progress':
                return 'published'
            case 'done':
                return 'archived'
            default:
                return 'draft'
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || !tickets) {
            return
        }

        const activeId = active.id as number
        const overId = over.id as TicketStatus

        // Update the ticket status
        updateTicketStatus.mutate({
            id: activeId,
            status: overId,
        })
    }

    async function onSubmit(data: CreateTicketForm) {
        createTicket.mutate(data)
    }

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
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="low">
                                                        Low
                                                    </SelectItem>
                                                    {/* <SelectItem value="medium">Medium</SelectItem> */}
                                                    <SelectItem value="high">
                                                        High
                                                    </SelectItem>
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
            <div className="rounded-md border p-4">
                <DndContext onDragEnd={handleDragEnd}>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <BoardColumn
                            id="todo"
                            title="To Do"
                            tickets={
                                tickets?.filter(
                                    (i) => i.status === 'todo'
                                ) || []
                            }
                        />
                        <BoardColumn
                            id="in-progress"
                            title="In Progress"
                            tickets={
                                tickets?.filter(
                                    (i) => i.status === 'in-progress'
                                ) || []
                            }
                        />
                        <BoardColumn
                            id="done"
                            title="Done"
                            tickets={
                                tickets?.filter(
                                    (i) => i.status === 'done'
                                ) || []
                            }
                        />
                    </div>
                </DndContext>
            </div>
        </div>
    )
}
