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

interface PrioritiesTabProps {
  project: NonNullable<ProjectContextType['data']>
}

interface PriorityFormData {
  name: string
  color: string
  level: number
}

interface PriorityItemProps {
  priority: any
  onEdit: (priority: any) => void
  onDelete: (priority: any) => void
}

// Sortable priority item component
function SortablePriorityItem({ priority, onEdit, onDelete }: PriorityItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

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
          style={{ backgroundColor: priority.color || '#ccc' }}
        />
        <span className="font-medium">{priority.name}</span>
        <span className="text-xs text-muted-foreground">(Level: {priority.level})</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag
            onEdit(priority);
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
            onDelete(priority);
          }}
          className="cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PrioritiesTab({ project }: PrioritiesTabProps) {
  const queryClient = useQueryClient()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPriority, setCurrentPriority] = useState<any>(null)
  const [formData, setFormData] = useState<PriorityFormData>({
    name: '',
    color: '#f39c12',
    level: 0
  })
  
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

  // Fetch priorities for the project
  const { data: priorities = [], isLoading } = useQuery({
    queryKey: ['projects', project?.id, 'priorities'],
    queryFn: async () => {
      const response = await directus.TicketsPriorities.query({
        filter: {
          project: project.id
        },
        sort: ['level']
      })
      return response || []
    }
  })

  // Create new priority mutation
  const createPriorityMutation = useMutation({
    mutationFn: async (data: PriorityFormData) => {
      return await directus.TicketsPriority.create({
        name: data.name,
        color: data.color,
        project: project.id,
        level: data.level
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Priority created', {
        description: 'The priority has been created successfully.'
      })
      setIsAddDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to create priority'
      })
    }
  })

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: Collections.TicketsPriorities['id'], data: Partial<PriorityFormData> }) => {
      return await directus.TicketsPriority.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Priority updated', {
        description: 'The priority has been updated successfully.'
      })
      setIsEditDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update priority'
      })
    }
  })

  // Delete priority mutation
  const deletePriorityMutation = useMutation({
    mutationFn: async (id: Collections.TicketsPriorities['id']) => {
      return await directus.TicketsPriority.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Priority deleted', {
        description: 'The priority has been deleted successfully.'
      })
      setIsDeleteDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to delete priority'
      })
    }
  })
  
  // Update order/level mutation for drag and drop
  const updateOrderMutation = useMutation({
    mutationFn: async (updatedPriorities: any[]) => {
      // Create an array of update promises for each priority that needs its level changed
      const updatePromises = updatedPriorities.map((priority, index) => {
        return directus.TicketsPriority.update(priority.id, {
          level: index
        })
      })
      // Wait for all updates to complete
      return Promise.all(updatePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Order updated', {
        description: 'The priority order has been updated successfully.'
      })
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to reorder priorities'
      })
    }
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    // Find indices
    const oldIndex = priorities.findIndex(priority => priority.id === active.id);
    const newIndex = priorities.findIndex(priority => priority.id === over.id);
    
    // Reorder the array locally
    const reorderedPriorities = arrayMove(priorities, oldIndex, newIndex);
    
    // Update the order in the database
    updateOrderMutation.mutate(reorderedPriorities);
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#f39c12',
      level: priorities.length // Set level to the highest current level + 1
    })
  }

  const handleEditPriority = (priority: any) => {
    setCurrentPriority(priority)
    setFormData({
      name: priority.name,
      color: priority.color,
      level: priority.level
    })
    setIsEditDialogOpen(true)
  }

  const handleDeletePriority = (priority: any) => {
    setCurrentPriority(priority)
    setIsDeleteDialogOpen(true)
  }

  const handleCreatePriority = () => {
    createPriorityMutation.mutate(formData)
  }

  const handleUpdatePriority = () => {
    if (currentPriority) {
      updatePriorityMutation.mutate({
        id: currentPriority.id,
        data: {
          name: formData.name,
          color: formData.color,
          level: formData.level
        }
      })
    }
  }

  const confirmDelete = () => {
    if (currentPriority) {
      deletePriorityMutation.mutate(currentPriority.id)
    }
  }

  if (isLoading) {
    return <div className="py-4">Loading priorities...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Ticket Priorities ({priorities.length})</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Priority
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Priority</DialogTitle>
              <DialogDescription>
                Create a new priority level for tickets in this project.
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
                  placeholder="e.g., Low, Medium, High"
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Level
                </Label>
                <Input
                  id="level"
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                  className="col-span-3"
                  min="0"
                  max="100"
                />
                <div className="col-span-4 text-xs text-muted-foreground text-right">
                  Higher values indicate higher priority.
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleCreatePriority} disabled={!formData.name}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {priorities.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-md">
          <p className="text-muted-foreground">No priorities created yet. Add a priority to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={priorities.map(priority => priority.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {priorities.map((priority: any) => (
                <SortablePriorityItem
                  key={priority.id}
                  priority={priority}
                  onEdit={handleEditPriority}
                  onDelete={handleDeletePriority}
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
            <DialogTitle>Edit Priority</DialogTitle>
            <DialogDescription>
              Update this priority's name, color, and level.
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-level" className="text-right">
                Level
              </Label>
              <Input
                id="edit-level"
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="col-span-3"
                min="0"
                max="100"
              />
              <div className="col-span-4 text-xs text-muted-foreground text-right">
                Higher values indicate higher priority.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePriority} disabled={!formData.name}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Priority</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this priority? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <strong>Warning:</strong> Deleting this priority may affect tickets that currently use it.
              Consider updating those tickets to use a different priority first.
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