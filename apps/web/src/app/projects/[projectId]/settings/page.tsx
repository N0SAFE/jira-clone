"use client"

import { BoardHeader } from '@/components/organisms/BoardHeader'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@repo/ui/components/shadcn/alert-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { Projects } from '@/routes'

export default function SettingsPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { project } = useProject();

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      // TODO: Implement project deletion API call
      Projects.immediate(router);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 p-8 pt-6">
      <BoardHeader>
        <h2 className="text-3xl font-bold tracking-tight">Project Settings</h2>
      </BoardHeader>

      <div className="rounded-md border p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input id="projectName" defaultValue={project?.name || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Project Description</Label>
          <Textarea 
            id="description" 
            defaultValue={project?.description || ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" defaultValue="UTC+00:00" />
        </div>

        <Button>Save Changes</Button>
      </div>

      <div className="rounded-md border border-destructive/50 p-4 space-y-2">
        <h3 className="text-xl font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Destructive actions that cannot be undone</p>
        
        <div className="border-t border-destructive/20 pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Delete Project</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this project and all its data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Project</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project
                    and all associated data including tickets, comments, and files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    onClick={handleDeleteProject}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  )
}
