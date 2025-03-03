'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProject } from '@/context/ProjectContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'
import { GeneralSettingsTab } from '@/components/project-settings/GeneralSettingsTab'
import { StatusesTab } from '@/components/project-settings/StatusesTab'
import { PrioritiesTab } from '@/components/project-settings/PrioritiesTab'
import { TicketTypesTab } from '@/components/project-settings/TicketTypesTab'

export default function ProjectSettingsPage() {
  const { data: project } = useProject() ?? {}
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'general')

  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  if (!project) {
    return (
      <div className="p-8">
        <div className="h-20 w-full animate-pulse rounded-md bg-muted"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Project Settings</h2>
      </div>

      <div className="flex-1 p-8 pt-0 min-h-0 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="statuses">Statuses</TabsTrigger>
            <TabsTrigger value="priorities">Priorities</TabsTrigger>
            <TabsTrigger value="ticket-types">Ticket Types</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralSettingsTab project={project} />
          </TabsContent>
          <TabsContent value="statuses">
            <StatusesTab project={project} />
          </TabsContent>
          <TabsContent value="priorities">
            <PrioritiesTab project={project} />
          </TabsContent>
          <TabsContent value="ticket-types">
            <TicketTypesTab project={project} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
