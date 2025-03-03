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
import { 
  Bug, CheckCircle, Bookmark, Target, 
  AlertTriangle, FileSpreadsheet, LayoutGrid
} from 'lucide-react'

interface TicketTypesTabProps {
  project: NonNullable<ProjectContextType['data']>
}

interface TypeFormData {
  name: string
  description: string
//   color: string
//   icon: string
  level: number
}

interface TypeItemProps {
  type: any
  onEdit: (type: any) => void
  onDelete: (type: any) => void
}

// // Icon mapping for ticket types
// const typeIcons: Record<string, React.ReactNode> = {
//   'task': <CheckCircle className="h-5 w-5" />,
//   'bug': <Bug className="h-5 w-5" />,
//   'epic': <Bookmark className="h-5 w-5" />,
//   'objective': <Target className="h-5 w-5" />,
//   'issue': <AlertTriangle className="h-5 w-5" />,
//   'story': <FileSpreadsheet className="h-5 w-5" />,
//   'feature': <LayoutGrid className="h-5 w-5" />
// }

// Sortable status item component
function SortableTypeItem({ type, onEdit, onDelete }: TypeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : 0,
  };

//   // Determine which icon to use
//   const IconComponent = type.icon && typeIcons[type.icon.toLowerCase()]
//     ? typeIcons[type.icon.toLowerCase()]
//     : typeIcons['task']; // Default to task icon

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
        {/* <div 
          className="flex items-center justify-center" 
          style={{ color: type.color || '#ccc' }}
        >
          {IconComponent}
        </div> */}
        <div>
          <span className="font-medium">{type.name}</span>
          <p className="text-xs text-muted-foreground">{type.description || 'No description'}</p>
        </div>
        {type.level > 0 && (
          <span className="text-xs px-2 py-1 bg-muted rounded-full">
            Level: {type.level}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering drag
            onEdit(type);
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
            onDelete(type);
          }}
          className="cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TicketTypesTab({ project }: TicketTypesTabProps) {
  const queryClient = useQueryClient()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentType, setCurrentType] = useState<any>(null)
  const [formData, setFormData] = useState<TypeFormData>({
    name: '',
    description: '',
    // color: '#3498db',
    // icon: 'task',
    level: 0
  })

//   // All available icons for selection
//   const availableIcons = [
//     { name: 'Task', value: 'task', component: <CheckCircle className="h-5 w-5" /> },
//     { name: 'Bug', value: 'bug', component: <Bug className="h-5 w-5" /> },
//     { name: 'Epic', value: 'epic', component: <Bookmark className="h-5 w-5" /> },
//     { name: 'Objective', value: 'objective', component: <Target className="h-5 w-5" /> },
//     { name: 'Issue', value: 'issue', component: <AlertTriangle className="h-5 w-5" /> },
//     { name: 'Story', value: 'story', component: <FileSpreadsheet className="h-5 w-5" /> },
//     { name: 'Feature', value: 'feature', component: <LayoutGrid className="h-5 w-5" /> }
//   ]
  
  // Configure dnd-kit sensors
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

  // Fetch ticket types for the project
  const { data: ticketTypes = [], isLoading } = useQuery({
    queryKey: ['projects', project?.id, 'ticket-types'],
    queryFn: async () => {
      const response = await directus.TicketsTypes.query({
        filter: {
          project: project.id
        },
        sort: ['level']
      })
      return response || []
    }
  })

  // Create new ticket type mutation
  const createTypeMutation = useMutation({
    mutationFn: async (data: TypeFormData) => {
      return await directus.TicketsType.create({
        name: data.name,
        description: data.description,
        // icon: data.icon,
        level: data.level,
        project: project.id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Ticket type created', {
        description: 'The ticket type has been created successfully.'
      })
      setIsAddDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to create ticket type'
      })
    }
  })

  // Update ticket type mutation
  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: Collections.TicketsTypes['id'], data: Partial<TypeFormData> }) => {
      return await directus.TicketsType.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Ticket type updated', {
        description: 'The ticket type has been updated successfully.'
      })
      setIsEditDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update ticket type'
      })
    }
  })

  // Delete ticket type mutation
  const deleteTypeMutation = useMutation({
    mutationFn: async (id: Collections.TicketsTypes['id']) => {
      return await directus.TicketsType.remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Ticket type deleted', {
        description: 'The ticket type has been deleted successfully.'
      })
      setIsDeleteDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to delete ticket type'
      })
    }
  })
  
  // Update level mutation for drag and drop reordering
  const updateLevelMutation = useMutation({
    mutationFn: async (updatedTypes: any[]) => {
      // Create an array of update promises for each type that needs its level changed
      const updatePromises = updatedTypes.map((type, index) => {
        return directus.TicketsTypes.update(type.id, {
          level: index
        })
      })
      // Wait for all updates to complete
      return Promise.all(updatePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['projects', project.id]})
      toast.success('Order updated', {
        description: 'The ticket type hierarchy has been updated successfully.'
      })
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to reorder ticket types'
      })
    }
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    // Find indices
    const oldIndex = ticketTypes.findIndex(type => type.id === active.id);
    const newIndex = ticketTypes.findIndex(type => type.id === over.id);
    
    // Reorder the array locally
    const reorderedTypes = arrayMove(ticketTypes, oldIndex, newIndex);
    
    // Update the order in the database
    updateLevelMutation.mutate(reorderedTypes);
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    //   color: '#3498db',
    //   icon: 'task',
      level: ticketTypes.length // Set level based on number of existing types
    })
  }

  const handleEditType = (type: any) => {
    setCurrentType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
    //   color: type.color,
    //   icon: type.icon || 'task',
      level: type.level
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteType = (type: any) => {
    setCurrentType(type)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateType = () => {
    if (!formData.name) {
      toast.error('Missing information', {
        description: 'Please provide a name for the ticket type'
      })
      return
    }
    
    createTypeMutation.mutate(formData)
  }

  const handleUpdateType = () => {
    if (currentType && !formData.name) {
      toast.error('Missing information', {
        description: 'Please provide a name for the ticket type'
      })
      return
    }
    
    if (currentType) {
      updateTypeMutation.mutate({
        id: currentType.id,
        data: formData
      })
    }
  }

  const confirmDelete = () => {
    if (currentType) {
      deleteTypeMutation.mutate(currentType.id)
    }
  }

  if (isLoading) {
    return <div className="py-4">Loading ticket types...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Ticket Types ({ticketTypes.length})</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Ticket Type</DialogTitle>
              <DialogDescription>
                Create a new ticket type for this project. Ticket types help categorize your work items.
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
                  placeholder="e.g., Bug, Task, Epic"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g., A problem that needs to be fixed"
                />
              </div>
              
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Color
                </Label>
                <div className="col-span-3">
                  <CirclePicker
                    color={formData.color}
                    onChangeComplete={(color) => setFormData({ ...formData, color: color.hex })}
                  />
                </div>
              </div> */}
              
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Icon
                </Label>
                <div className="col-span-3 grid grid-cols-4 gap-2">
                  {availableIcons.map((icon) => (
                    <div 
                      key={icon.value} 
                      className={`flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer border-2 ${
                        formData.icon === icon.value ? 'border-primary' : 'border-transparent hover:bg-muted'
                      }`}
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                    >
                      <div style={{ color: formData.icon === icon.value ? formData.color : 'inherit' }}>
                        {icon.component}
                      </div>
                      <span className="text-xs">{icon.name}</span>
                    </div>
                  ))}
                </div>
              </div> */}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Hierarchy Level
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
                  Higher levels can contain lower levels. For example, an Epic (level 2) can contain Tasks (level 0).
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={handleCreateType} disabled={!formData.name}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {ticketTypes.length === 0 ? (
        <div className="text-center py-8 bg-muted rounded-md">
          <p className="text-muted-foreground">No ticket types created yet. Add a type to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ticketTypes.map(type => type.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {ticketTypes.map((type) => (
                <SortableTypeItem
                  key={type.id}
                  type={type}
                  onEdit={handleEditType}
                  onDelete={handleDeleteType}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Ticket Type</DialogTitle>
            <DialogDescription>
              Update this ticket type's properties.
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
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Color
              </Label>
              <div className="col-span-3">
                <CirclePicker
                  color={formData.color}
                  onChangeComplete={(color) => setFormData({ ...formData, color: color.hex })}
                />
              </div>
            </div> */}
            
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Icon
              </Label>
              <div className="col-span-3 grid grid-cols-4 gap-2">
                {availableIcons.map((icon) => (
                  <div 
                    key={icon.value} 
                    className={`flex flex-col items-center gap-1 p-2 rounded-md cursor-pointer border-2 ${
                      formData.icon === icon.value ? 'border-primary' : 'border-transparent hover:bg-muted'
                    }`}
                    onClick={() => setFormData({ ...formData, icon: icon.value })}
                  >
                    <div style={{ color: formData.icon === icon.value ? formData.color : 'inherit' }}>
                      {icon.component}
                    </div>
                    <span className="text-xs">{icon.name}</span>
                  </div>
                ))}
              </div>
            </div> */}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-level" className="text-right">
                Hierarchy Level
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
                Higher levels can contain lower levels. For example, an Epic (level 2) can contain Tasks (level 0).
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateType} disabled={!formData.name}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Ticket Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket type? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              <strong>Warning:</strong> Deleting this ticket type may affect tickets that currently use it.
              Consider updating those tickets to use a different type first.
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