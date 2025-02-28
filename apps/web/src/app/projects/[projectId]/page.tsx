'use client'

import { useQuery } from '@tanstack/react-query'
import directus from '@/lib/directus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Activity, ArrowRight, Layers, ListChecks, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@repo/ui/components/shadcn/button'
import { formatDate } from '@/lib/utils'
import { useProject } from '@/context/ProjectContext'

export default function ProjectOverviewPage() {
  const { data: project } = useProject() ?? {}

  // Fetch tickets for the project
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['projects', project?.id, 'tickets', 'overview'],
    queryFn: async () => {
      if (!project?.id) return []
      
      const response = await directus.Tickets.query({
        filter: {
          project: project.id
        },
        fields: ['id', 'title', 'description', 'status', 'priority', 'assignee', 'date_created', 'date_updated']
      })
      
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch statuses for the project
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['projects', project?.id, 'statuses', 'overview'],
    queryFn: async () => {
      if (!project?.id) return []
      const response = await directus.TicketsStatuses.query({
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
  const { data: priorities = [], isLoading: isLoadingPriorities } = useQuery({
    queryKey: ['projects', project?.id, 'priorities', 'overview'],
    queryFn: async () => {
      if (!project?.id) return []
      const response = await directus.TicketsPriorities.query({
        filter: {
          project: project.id
        },
        sort: ['level']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Calculate ticket statistics
  const statusDistribution = statuses.map(status => {
    const count = tickets.filter(ticket => ticket.status === status.id).length
    return {
      name: status.name,
      value: count,
      color: status.color
    }
  })

  const priorityDistribution = priorities.map(priority => {
    const count = tickets.filter(ticket => ticket.priority === priority.id).length
    return {
      name: priority.name, 
      value: count,
      color: priority.color
    }
  })

  const completedTasks = tickets.filter(ticket => {
    const status = statuses.find(s => s.id === ticket.status)
    return status?.name?.toLowerCase().includes('done') || status?.name?.toLowerCase().includes('complete')
  }).length

  const totalTasks = tickets.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Get recent tickets - latest 5 tickets
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
    .slice(0, 5)

  if (isLoadingTickets || isLoadingStatuses || isLoadingPriorities || !project) {
    return (
      <div className="p-8">
        <div className="h-20 w-full animate-pulse rounded-md bg-muted"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="h-40 animate-pulse rounded-md bg-muted"></div>
          <div className="h-40 animate-pulse rounded-md bg-muted"></div>
          <div className="h-40 animate-pulse rounded-md bg-muted"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description || 'No project description provided'}</p>
        </div>
        <div className="flex items-center mt-4 sm:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.id}`}>
              View Board
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {tickets.length === 0 ? 'No tickets yet' : `${completedTasks} completed`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Statuses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statuses.length}</div>
            <p className="text-xs text-muted-foreground">
              {statuses.length === 0 ? 'No statuses configured' : `${statuses.map(s => s.name).join(', ')}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Priorities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priorities.length}</div>
            <p className="text-xs text-muted-foreground">
              {priorities.length === 0 ? 'No priorities configured' : `${priorities.map(p => p.name).join(', ')}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Ticket distribution across statuses</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[220px]">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Ticket distribution across priorities</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[220px]">
            {priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityDistribution}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest tickets created</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map(ticket => {
                  const status = statuses.find(s => s.id === ticket.status)
                  return (
                    <div key={ticket.id} className="border-b pb-2 last:border-none">
                      <div className="flex justify-between items-start">
                        <Link 
                          href={`/projects/${project.id}/tickets/${ticket.id}`}
                          className="font-medium hover:underline line-clamp-1"
                        >
                          {ticket.title}
                        </Link>
                        <div 
                          className="h-2 w-2 rounded-full mt-2" 
                          style={{ backgroundColor: status?.color || '#ccc' }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(ticket.date_created)}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h2 className="text-xl font-bold">Project Information</h2>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About this Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Key</h3>
                  <p>{project.key || 'Not set'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Created</h3>
                  <p>{formatDate(project.date_created)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Owner</h3>
                  <p>
                    {project.owner ? 
                      `${project.owner.first_name} ${project.owner.last_name || ''}` : 
                      'No owner assigned'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Last Updated</h3>
                  <p>{project.date_updated ? formatDate(project.date_updated) : 'Never'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="whitespace-pre-wrap">
                  {project.description || 'No description provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/projects/${project.id}/settings`}>
                Manage Project Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People with access to this project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.members && project.members.length > 0 ? (
                <div className="space-y-4">
                  {project.members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {member.directus_user?.first_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{member.directus_user?.first_name} {member.directus_user?.last_name || ''}</p>
                          <p className="text-sm text-muted-foreground">Member</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">No team members</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}