'use client'

import { useState } from 'react'
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

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: any
}

export default function CreateTicketDialog({
  open,
  onOpenChange,
  project
}: CreateTicketDialogProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assignee: ''
  })

  // Fetch statuses for the project
  const { data: statuses = [] } = useQuery({
    queryKey: ['projects', project?.id, 'statuses'],
    queryFn: async () => {
      if (!project?.id) return []
      const response = await directus.TicketsStatus.query({
        filter: {
          project: project.id
        },
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
      const response = await directus.TicketsPriority.query({
        filter: {
          project: project.id
        },
        sort: ['level']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch team members for the project (simplified example)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['projects', project?.id, 'team'],
    queryFn: async () => {
      if (!project?.id) return []
      // This would typically fetch members with proper permissions for this project
      // Simplified example - in a real app, there would be a project_members join table
      const response = await directus.Users.query({
        limit: 10
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await directus.Tickets.createOne({
        ...data,
        project: project.id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects', project.id, 'tickets'])
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

  const handleCreateTicket = () => {
    if (!formData.title) {
      toast.error('Missing information', {
        description: 'Please provide a title for the ticket'
      })
      return
    }

    if (!formData.status && statuses.length > 0) {
      // Automatically select the first status if none selected
      formData.status = statuses[0].id
    }

    createTicketMutation.mutate(formData)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: statuses.length > 0 ? statuses[0].id : '',
      priority: '',
      assignee: ''
    })
  }

  // Set default status when the dialog opens and statuses are available
  useState(() => {
    if (open && statuses.length > 0 && !formData.status) {
      setFormData(prev => ({
        ...prev,
        status: statuses[0].id
      }))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Add a new ticket to your project. Fill out the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter ticket title"
              className="col-span-3"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue or task"
              className="col-span-3"
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
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
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status: any) => (
                      <SelectItem key={status.id} value={status.id}>
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
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
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
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority: any) => (
                      <SelectItem key={priority.id} value={priority.id}>
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
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select
              value={formData.assignee}
              onValueChange={(value) => setFormData({ ...formData, assignee: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map((member: any) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name || ''} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateTicket}>Create Ticket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}