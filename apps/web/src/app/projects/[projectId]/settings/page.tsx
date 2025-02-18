"use client"

import { BoardHeader } from '@/components/organisms/BoardHeader'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { Textarea } from '@repo/ui/components/shadcn/textarea'

export default function SettingsPage() {
  return (
    <div className="space-y-4 p-8 pt-6">
      <BoardHeader>
        <h2 className="text-3xl font-bold tracking-tight">Project Settings</h2>
      </BoardHeader>

      <div className="rounded-md border p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <Input id="projectName" defaultValue="My Project" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Project Description</Label>
          <Textarea 
            id="description" 
            defaultValue="A project management tool built with Next.js and Shadcn UI"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" defaultValue="UTC+00:00" />
        </div>

        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
