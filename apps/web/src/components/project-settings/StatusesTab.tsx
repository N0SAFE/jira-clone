'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/shadcn/dialog'
import { Plus, Trash2, GripVertical, Edit } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import directus from '@/lib/directus'
import { CirclePicker } from 'react-color'
import { Collections } from '@repo/directus-sdk/client'
import { ProjectContextType } from '@/context/ProjectContext'

interface StatusesTabProps {
  project: NonNullable<ProjectContextType['data']>
}

interface StatusFormData {
  name: string
  color: string
  order: number
}

interface StatusItemProps {
  status: any
  onEdit: (status: any) => void
  onDelete: (status: any) => void
}

// Sortable status item component
function SortableStatusItem({ status, onEdit, onDelete }: StatusItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-3 bg-card border rounded-md mb-2 cursor-grab touch-manipulation active:cursor-grabbing"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-6">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div 
          className="h-4 w-4 rounded-full" 
          style={{ backgroundColor: status.color || '#ccc' }}
        />
        <span>{status.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag
            onEdit(status);
          }}
          className="cursor-pointer"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag
            onDelete(status);
          }}
          className="cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function StatusesTab({ project }: StatusesTabProps) {
  const queryClient = useQueryClient()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<StatusFormData>({
    name: '',
    color: '#3498db',
    order: 0
  })
  const [currentStatus, setCurrentStatus] = useState<any>(null)

  // Configure dnd-kit sensors with improved settings for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum distance before drag starts (prevents accidental drags)
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch statuses for the project
  const { data: statuses = [], isLoading } = useQuery({
    queryKey: ['projects', project?.id, 'statuses'],
    queryFn: async () => {
      const response = await directus.TicketsStatuses.query({
        filter: {
          project: project.id
        },
        sort: ['order']
      })
      return response || []
    }
  })
  
  // Create new status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      return await directus.TicketsStatus.create({
        name: data.name,
        color: data.color,
        project: project.id,
        order: statuses.reduce((max, status) => Math.max(max, status.order), -1) + 1
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] })
      toast.success('Status created', {
        description: 'The status has been created successfully.'
      })
      setIsAddDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to create status'
      })
    }
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: Collections.TicketsStatuses['id'], data: Partial<StatusFormData> }) => {
      return await directus.TicketsStatus.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] })
      toast.success('Status updated', {
        description: 'The status has been updated successfully.'
      })
      setIsEditDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update status'
      })
    }
  })

  // Delete status mutation
  const deleteStatusMutation = useMutation({
    mutationFn: async (id: Collections.TicketsStatuses['id']) => {
      return await directus.TicketsStatus.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] })
      toast.success('Status deleted', {
        description: 'The status has been deleted successfully.'
      })
      setIsDeleteDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to delete status'
      })
    }
  })

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updatedStatuses: any[]) => {
      // Create an array of update promises for each status that needs its order changed
      const updatePromises = updatedStatuses.map((status, index) => {
        return directus.TicketsStatus.update(status.id, {
          order: index
        })
      })
      // Wait for all updates to complete
      return Promise.all(updatePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] })
      toast.success('Order updated', {
        description: 'The status order has been updated successfully.'
      })
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to reorder statuses'
      })
    }
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    // Find indices
    const oldIndex = statuses.findIndex(status => status.id === active.id);
    const newIndex = statuses.findIndex(status => status.id === over.id);
    
    // Reorder the array locally
    const reorderedStatuses = arrayMove(statuses, oldIndex, newIndex);
    
    // Update the order in the database
    updateOrderMutation.mutate(reorderedStatuses);
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3498db',
      order: statuses.length
    })
  }

  const handleEditStatus = (status: any) => {
    setCurrentStatus(status)
    setFormData({
      name: status.name,
      color: status.color,
      order: status.order
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteStatus = (status: any) => {
    setCurrentStatus(status)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (currentStatus) {
      deleteStatusMutation.mutate(currentStatus.id)
    }
  }

  const handleCreateStatus = () => {
    createStatusMutation.mutate(formData)
  }

  const handleUpdateStatus = () => {
    if (currentStatus) {
      updateStatusMutation.mutate({
        id: currentStatus.id,
        data: {
          name: formData.name,
          color: formData.color
        }
      })
    }
  }

  if (isLoading) {
    return <div className="py-4">Loading statuses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Ticket Statuses ({statuses.length})</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Status</DialogTitle>
              <DialogDescription>
                Create a new status for tickets in this project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., To Do, In Progress, Done"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Color
                </Label>
                <div className="col-span-3">
                  <CirclePicker
                    color={formData.color}
                    onChangeComplete={(color) => setFormData({ ...formData, color: color.hex })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleCreateStatus} disabled={!formData.name}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {statuses.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-md">
          <p className="text-muted-foreground">No statuses created yet. Add a status to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={statuses.map(status => status.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {statuses.map((status) => (
                <SortableStatusItem
                  key={status.id}
                  status={status}
                  onEdit={handleEditStatus}
                  onDelete={handleDeleteStatus}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Update this status's name and color.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Color
              </Label>
              <div className="col-span-3">
                <CirclePicker
                  color={formData.color}
                  onChangeComplete={(color) => setFormData({ ...formData, color: color.hex })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={!formData.name}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this status? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <strong>Warning:</strong> Deleting this status may affect tickets that currently use it.
              Consider updating those tickets to use a different status first.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}