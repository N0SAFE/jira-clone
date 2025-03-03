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

  // Fetch tickets for the project with expanded relationships
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['projects', project?.id, 'tickets', 'overview'],
    queryFn: async () => {
      if (!project?.id) {
        return [];
      }
      
      const response = await directus.Tickets.query({
        filter: {
          project: project.id
        },
        fields: [
          'id', 
          'title', 
          'description', 
          'date_created', 
          'date_updated',
          { status: ['id', 'name', 'color'] },
          { priority: ['id', 'name', 'color', 'level'] },
          { type: ['id', 'name', 'icon'] },
          { assignee: ['id', 'first_name', 'last_name'] }
        ]
      })
      
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch statuses for the project
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['projects', project?.id, 'statuses', 'overview'],
    queryFn: async () => {
      if (!project?.id) {
        return [];
      }
      const response = await directus.TicketsStatuses.query({
        filter: {
          project: project.id
        },
        sort: ['order'],
        fields: ['id', 'name', 'color', 'order']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch priorities for the project
  const { data: priorities = [], isLoading: isLoadingPriorities } = useQuery({
    queryKey: ['projects', project?.id, 'priorities', 'overview'],
    queryFn: async () => {
      if (!project?.id) {
        return [];
      }
      const response = await directus.TicketsPriorities.query({
        filter: {
          project: project.id
        },
        sort: ['level'],
        fields: ['id', 'name', 'color', 'level']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Fetch types for the project
  const { data: types = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['projects', project?.id, 'types', 'overview'],
    queryFn: async () => {
      if (!project?.id) {
        return [];
      }
      const response = await directus.TicketsTypes.query({
        filter: {
          project: project.id
        },
        sort: ['level'],
        fields: ['id', 'name', 'icon', 'level', 'description']
      })
      return response || []
    },
    enabled: !!project?.id
  })

  // Calculate ticket statistics
  const statusDistribution = statuses.map(status => {
    const count = tickets.filter(ticket => {
      return ticket.status?.id === status.id || ticket.status === status.id
    }).length
    return {
      name: status.name || 'Unnamed Status',
      value: count,
      color: status.color
    }
  })

  const priorityDistribution = priorities.map(priority => {
    const count = tickets.filter(ticket => {
      return ticket.priority?.id === priority.id || ticket.priority === priority.id
    }).length
    return {
      name: priority.name || 'Unnamed Priority',
      value: count,
      color: priority.color
    }
  })

  const typeDistribution = types.map(type => {
    const count = tickets.filter(ticket => {
      return ticket.type?.id === type.id || ticket.type === type.id
    }).length
    return {
      name: type.name || 'Unnamed Type',
      value: count,
      icon: type.icon
    }
  })

  const completedTasks = tickets.filter(ticket => {
    const statusId = ticket.status?.id || ticket.status;
    const status = statuses.find(s => s.id === statusId);
    return status?.name?.toLowerCase().includes('done') || status?.name?.toLowerCase().includes('complete');
  }).length

  const totalTasks = tickets.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Get recent tickets - latest 5 tickets
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
    .slice(0, 5)

  if (isLoadingTickets || isLoadingStatuses || isLoadingPriorities || isLoadingTypes || !project) {
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
            <Link href={`/projects/${project.id}/board`}>
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
            <CardTitle className="text-sm font-medium">Types</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{types.length}</div>
            <p className="text-xs text-muted-foreground">
              {types.length === 0 ? 'No ticket types configured' : `${types.map(t => t.name).join(', ')}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Distribution Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Distribution of tickets by status</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px]">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
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

        {/* Priority Distribution Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Distribution of tickets by priority level</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px]">
            {priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={priorityDistribution} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" barSize={20}>
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

        {/* Type Distribution Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Type Distribution</CardTitle>
            <CardDescription>Distribution of tickets by type</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px]">
            {typeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={typeDistribution}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest tickets created</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTickets.length > 0 ? (
              <div className="space-y-4">
                {recentTickets.map(ticket => {
                  const status = ticket.status?.color ? ticket.status : statuses.find(s => s.id === ticket.status);
                  const ticketType = ticket.type?.name ? ticket.type : types.find(t => t.id === ticket.type);
                  return (
                    <div key={ticket.id} className="border-b pb-2 last:border-none">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/projects/${project.id}/tickets/${ticket.id}`}
                            className="font-medium hover:underline line-clamp-1"
                          >
                            {ticket.title}
                          </Link>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-muted-foreground">
                              {ticketType?.name && <span className="mr-2">{ticketType.name}</span>}
                            </span>
                          </div>
                        </div>
                        <div 
                          className="h-3 w-3 rounded-full mt-2" 
                          style={{ backgroundColor: status?.color || '#ccc' }}
                          title={status?.name || 'Status'}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(ticket.date_created!)}
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

        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Summary</CardTitle>
            <CardDescription>Overall project metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{completionRate}%</span>
                  <span className="text-sm text-muted-foreground">completed</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Total Types</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{types.length}</span>
                  <span className="text-sm text-muted-foreground">configured</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Active Tickets</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{tickets.length - completedTasks}</span>
                  <span className="text-sm text-muted-foreground">in progress</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Completed</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{completedTasks}</span>
                  <span className="text-sm text-muted-foreground">tickets</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h2 className="text-xl font-bold">Project Information</h2>
      </div>

      {/* Rest of the component remains the same */}
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
                  <p>{formatDate(project.date_created!)}</p>
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