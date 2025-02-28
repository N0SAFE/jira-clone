'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import directus from '@/lib/directus'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/shadcn/dialog'
import { ProjectContextType } from '@/context/ProjectContext'

interface GeneralSettingsTabProps {
  project: NonNullable<ProjectContextType['data']>
}

export function GeneralSettingsTab({ project }: GeneralSettingsTabProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: project.name || '',
    key: project.key || '',
    description: project.description || '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const updateProjectMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await directus.Project.update(project.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', project.id] })
      toast.success('Project updated', {
        description: 'The project has been updated successfully.'
      })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to update project'
      })
    }
  })

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      return await directus.Project.remove(project.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted', {
        description: 'The project has been deleted successfully.'
      })
      // Redirect to projects page
      window.location.href = '/projects'
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.message || 'Failed to delete project'
      })
    }
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Reset form data to original project values
    setFormData({
      name: project.name || '',
      key: project.key || '',
      description: project.description || '',
    })
    setIsEditing(false)
  }

  const handleSave = () => {
    updateProjectMutation.mutate(formData)
  }

  const confirmDelete = () => {
    deleteProjectMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Project Details</h2>
        {!isEditing ? (
          <Button variant="outline" onClick={handleEdit}>
            Edit Project
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Project Name
          </Label>
          <div className="col-span-3">
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Project name"
              />
            ) : (
              <div className="py-2">{project.name}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="key" className="text-right">
            Project Key
          </Label>
          <div className="col-span-3">
            {isEditing ? (
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                placeholder="KEY"
                maxLength={10}
                className="uppercase"
              />
            ) : (
              <div className="py-2">
                <span className="font-mono bg-muted px-2 py-1 rounded">{project.key}</span>
              </div>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                The project key is used as a prefix for all tickets in this project (e.g. KEY-123)
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="description" className="text-right pt-2">
            Description
          </Label>
          <div className="col-span-3">
            {isEditing ? (
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this project"
                rows={5}
              />
            ) : (
              <div className="py-2 whitespace-pre-wrap">
                {project.description || <span className="text-muted-foreground italic">No description provided</span>}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">
            Created By
          </Label>
          <div className="col-span-3 py-2">
            {project.user_created ? (
              <span>{project.user_created.first_name} {project.user_created.last_name}</span>
            ) : (
              <span className="text-muted-foreground italic">Unknown</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">
            Created On
          </Label>
          <div className="col-span-3 py-2">
            {project.date_created ? (
              <span>{new Date(project.date_created).toLocaleDateString()}</span>
            ) : (
              <span className="text-muted-foreground italic">Unknown</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-md font-medium mb-4">Danger Zone</h3>
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-destructive">Delete Project</h4>
              <p className="text-sm text-muted-foreground">
                Once you delete a project, there is no going back. All tickets and data will be permanently removed.
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold">
              Type "{project.key}" to confirm deletion:
            </p>
            <Input 
              className="mt-2"
              id="confirm-delete"
              placeholder={project.key}
              onChange={(e) => {
                const confirmButton = document.getElementById('confirm-delete-button') as HTMLButtonElement;
                if (confirmButton) {
                  confirmButton.disabled = e.target.value !== project.key;
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              id="confirm-delete-button"
              variant="destructive" 
              onClick={confirmDelete}
              disabled={true}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}