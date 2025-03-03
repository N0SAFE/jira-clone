'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/shadcn/dialog'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import { Label } from '@repo/ui/components/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/shadcn/select'
import directus from '@/lib/directus'
import { Bug, CheckCircle, Bookmark, Target, AlertTriangle, FileSpreadsheet, LayoutGrid } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/shadcn/form'
import { Collections } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/utils'

// Define schema for form validation
const ticketFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  status: z.number().optional(),
  priority: z.number().optional(),
  assignee: z.number().optional().nullable(),
  ticket_type: z.number().optional(),
  parent_ticket: z.number().optional().nullable()
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ApplyFields<Collections.Projects, ['id']>
  parentTicket?: number // Optional parent ticket ID for creating child tickets
}

export default function CreateTicketDialog({
  open,
  onOpenChange,
  project,
  parentTicket
}: CreateTicketDialogProps) {
  const queryClient = useQueryClient()

  // Define form with zod resolver
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: undefined,
      priority: undefined,
      assignee: null,
      ticket_type: undefined,
      parent_ticket: parentTicket || null
    },
  });

  // Fetch statuses for the project
  const { data: statuses = [] } = useQuery({
    queryKey: ['projects', project?.id, 'statuses'],
    queryFn: async () => {
      if (!project?.id) return []
      const response = await directus.TicketsStatuses.query({
        filter: { project: project.id },
        sort: ['order']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch priorities for the project
  const { data: priorities = [] } = useQuery({
    queryKey: ['projects', project?.id, 'priorities'],
    queryFn: async () => {
      if (!project?.id) return []
      const response = await directus.TicketsPriorities.query({
        filter: { project: project.id },
        sort: ['level']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch ticket types for the project
  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['projects', project?.id, 'ticket-types'],
    queryFn: async () => {
      if (!project?.id) return []
      const response = await directus.TicketsTypes.query({
        filter: { project: project.id },
        sort: ['level']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Get current selected ticket type
  const selectedTypeId = form.watch('ticket_type');
  
  // Fetch potential parent tickets (for hierarchy)
  const { data: potentialParentTickets = [] } = useQuery({
    queryKey: ['projects', project?.id, 'potential-parent-tickets', selectedTypeId],
    queryFn: async () => {
      if (!project?.id || !selectedTypeId) return []
      
      // Find the current ticket type
      const currentType = ticketTypes.find(type => type.id === selectedTypeId)
      if (!currentType) return []
      
      // Only fetch potential parents if this type can be a child (has a level < some other type)
      const currentLevel = currentType.level || 0
      const higherLevelTypes = ticketTypes
        .filter(type => (type.level || 0) > currentLevel)
        .map(type => type.id)
        
      if (higherLevelTypes.length === 0) return []
      
      const response = await directus.Tickets.query({
        filter: {
          project: project.id,
          // Only tickets with higher level types can be parents
          type: {
            _in: higherLevelTypes
          }
        },
        fields: ['id', 'title', 'type']
      })
      return response || []
    },
    enabled: !!project?.id && !!selectedTypeId && ticketTypes.length > 0
  })

  // Fetch team members for the project
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['projects', project?.id, 'team'],
    queryFn: async () => {
      if (!project?.id) return []
      // This would typically fetch members with proper permissions for this project
      const response = await directus.DirectusUsers.query({
        limit: 10
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      // Filter out null values
      const sanitizedData: Record<string, any> = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          sanitizedData[key] = value;
        }
      });
      
      return await directus.Ticket.create({
        ...sanitizedData,
        project: project.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id, 'tickets']})
      toast.success('Ticket created', {
        description: 'The ticket has been created successfully.'
      })
      resetForm()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to create ticket'
      })
    }
  })

  function onSubmit(values: TicketFormValues) {
    createTicketMutation.mutate(values);
  }

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      status: statuses.length > 0 ? Number(statuses[0].id) : undefined,
      priority: undefined,
      assignee: null,
      ticket_type: ticketTypes.length > 0 ? Number(ticketTypes[0].id) : undefined,
      parent_ticket: parentTicket || null
    });
  }

  // Set default values when the dialog opens and data is available
  useEffect(() => {
    if (open) {
      // Reset form to defaults
      let defaultValues: Partial<TicketFormValues> = {
        title: "",
        description: "",
      };
      
      if (statuses.length > 0) {
        defaultValues.status = Number(statuses[0].id);
      }
      
      if (ticketTypes.length > 0) {
        // Default to Task type if it exists
        const taskType = ticketTypes.find(t => t.name.toLowerCase() === 'task');
        defaultValues.ticket_type = Number(taskType?.id || ticketTypes[0].id);
      }
      
      if (parentTicket) {
        defaultValues.parent_ticket = parentTicket;
      }
      
      form.reset(defaultValues);
    }
  }, [open, statuses, ticketTypes, parentTicket, form]);
  
  // Determine if a ticket type can have a parent
  const canHaveParent = (typeId?: number) => {
    if (!typeId || ticketTypes.length === 0) return false;
    
    const currentType = ticketTypes.find(type => Number(type.id) === typeId);
    if (!currentType) return false;
    
    // The ticket can have a parent if its level is less than some other type's level
    const currentLevel = currentType.level || 0;
    return ticketTypes.some(type => (type.level || 0) > currentLevel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Add a new ticket to your project. Fill out the details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Ticket Type Selector */}
            <FormField
              control={form.control}
              name="ticket_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type</FormLabel>
                  <FormControl>
                    {ticketTypes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No ticket types defined.{' '}
                        <a 
                          href={`/projects/${project.id}/settings?tab=ticket-types`}
                          className="text-primary hover:underline"
                        >
                          Create one first
                        </a>
                      </div>
                    ) : (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          // Reset parent ticket when type changes
                          form.setValue("parent_ticket", null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="flex-shrink-0"
                                  style={{ color: type.color }}
                                >
                                  {type.icon && typeIcons[type.icon.toLowerCase()] || <CheckCircle className="h-4 w-4" />}
                                </div>
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Ticket Selector - Only show if the ticket type can have a parent */}
            {selectedTypeId && canHaveParent(selectedTypeId) && (
              <FormField
                control={form.control}
                name="parent_ticket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Ticket</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No parent (standalone ticket)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No parent (standalone ticket)</SelectItem>
                          {potentialParentTickets.map((parentTicket: any) => (
                            <SelectItem key={parentTicket.id} value={parentTicket.id.toString()}>
                              {parentTicket.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ticket title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the issue or task" 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Status and Priority Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      {statuses.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No statuses defined.{' '}
                          <a 
                            href={`/projects/${project.id}/settings?tab=statuses`}
                            className="text-primary hover:underline"
                          >
                            Create one first
                          </a>
                        </div>
                      ) : (
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status: any) => (
                              <SelectItem key={status.id} value={status.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: status.color }}
                                  />
                                  {status.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
                    <FormControl>
                      {priorities.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No priorities defined.{' '}
                          <a 
                            href={`/projects/${project.id}/settings?tab=priorities`}
                            className="text-primary hover:underline"
                          >
                            Create one first
                          </a>
                        </div>
                      ) : (
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority: any) => (
                              <SelectItem key={priority.id} value={priority.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: priority.color }}
                                  />
                                  {priority.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Assignee Field */}
            <FormField
              control={form.control}
              name="assignee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {teamMembers.map((member: any) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.first_name} {member.last_name || ''} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Ticket</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}