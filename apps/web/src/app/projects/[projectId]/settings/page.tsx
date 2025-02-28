'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/shadcn/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/shadcn/card'
import { useProject } from '@/context/ProjectContext'
import { StatusesTab } from '@/components/project-settings/StatusesTab'
import { PrioritiesTab } from '@/components/project-settings/PrioritiesTab'
import { GeneralSettingsTab } from '@/components/project-settings/GeneralSettingsTab'
import { BoardHeader } from '@/components/organisms/BoardHeader'

export default function ProjectSettingsPage() {
  const { data: project, isLoading } = useProject() ?? {}
  const [activeTab, setActiveTab] = useState('general')

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-20 w-full animate-pulse rounded-md bg-muted"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Project not found</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your project settings, statuses, and priorities</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="priorities">Priorities</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage general project settings</CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettingsTab project={project} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Statuses</CardTitle>
              <CardDescription>Manage the statuses for tickets in this project</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusesTab project={project} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priorities">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Priorities</CardTitle>
              <CardDescription>Manage the priorities for tickets in this project</CardDescription>
            </CardHeader>
            <CardContent>
              <PrioritiesTab project={project} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
