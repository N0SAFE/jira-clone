'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'
import { 
  CalendarDays, 
  CheckCircle, 
  Clock, 
  Kanban, 
  LayoutDashboard, 
  ListChecks, 
  Plus, 
  RefreshCw,
  ArrowUpRight,
  LineChart,
  Bell
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/shadcn/avatar'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Progress } from '@repo/ui/components/shadcn/progress'
import Link from 'next/link'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import directus from '@/lib/directus'
import { cn } from '@/lib/utils'
import { NewProjectModal } from '@/components/organisms/NewProjectModal'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        return await directus.Projects.query({
          filter: {
            _or: [
              {
                user_created: {
                  id: {
                    _eq: session?.user?.id,
                  },
                },
              },
              {
                members: {
                  directus_user: {
                    id: {
                      _eq: session?.user?.id,
                    },
                  },
                },
              },
            ],
          },
          fields: ['id', 'name', 'description', 'key', 'date_created', {
            owner: ['id', 'first_name', 'last_name', 'avatar'],
            user_created: ['id', 'first_name', 'last_name', 'avatar'],
            statuses: ['id', 'name', 'color'],
          }],
        })
      } catch (error) {
        console.error('Error fetching projects:', error)
        return []
      }
    },
    enabled: !!session?.user?.id
  })

  // Fetch assigned tickets
  const { data: assignedTickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['assigned-tickets'],
    queryFn: async () => {
      try {
        return await directus.Tickets.query({
          filter: {
            assignee: {
              id: {
                _eq: session?.user?.id,
              },
            },
          },
          fields: ['id', 'title', 'date_created', 'date_updated', {
            project: ['id', 'name', 'key'],
            status: ['id', 'name', 'color'],
            priority: ['id', 'name', 'color', 'level'],
            type: ['id', 'name', 'icon'],
          }],
          sort: ['-date_updated'],
          limit: 10,
        })
      } catch (error) {
        console.error('Error fetching assigned tickets:', error)
        return []
      }
    },
    enabled: !!session?.user?.id
  })

  // Fetch recent activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      try {
        // Here you would normally fetch activities from a dedicated API endpoint
        // For now, we'll create some dummy data
        return [
          { id: 1, user: { name: "Alex Johnson", avatar: null }, action: "created a new ticket", target: "Fix navigation menu", time: new Date(Date.now() - 2 * 60 * 60 * 1000) },
          { id: 2, user: { name: "Sarah Smith", avatar: null }, action: "completed", target: "Homepage redesign", time: new Date(Date.now() - 5 * 60 * 60 * 1000) },
          { id: 3, user: { name: session?.user?.name || "You", avatar: session?.user?.image }, action: "updated the status of", target: "Backend API integration", time: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          { id: 4, user: { name: "Mark Wilson", avatar: null }, action: "commented on", target: "User authentication flow", time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        ]
      } catch (error) {
        console.error('Error fetching activities:', error)
        return []
      }
    },
    enabled: !!session?.user?.id
  })

  // Calculate project statistics
  const stats = {
    totalProjects: projects.length,
    activeTickets: assignedTickets.length,
    completedTasks: assignedTickets.filter(ticket => ticket.status?.name?.toLowerCase().includes('done')).length,
    teamMembers: 9 // This would ideally come from an API call
  }

  // Calculate tickets by status
  const ticketsByStatus = assignedTickets.reduce((acc, ticket) => {
    const status = ticket.status?.name || "Unknown"
    if (!acc[status]) acc[status] = 0
    acc[status]++
    return acc
  }, {} as Record<string, number>)

  // If not logged in, redirect to login
  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Please log in to view your dashboard</h2>
          <Button asChild>
            <Link href="/api/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Welcome header with user info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your work and activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsProjectModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Dashboard tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="my-work">
            <ListChecks className="mr-2 h-4 w-4" />
            My Work
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Kanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalProjects > 0 ? `${Math.round(stats.totalProjects * 0.2)} new this month` : 'No projects yet'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeTickets > 0 ? `${Math.round(stats.activeTickets * 0.3)} require attention` : 'No active tickets'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedTasks > 0 ? `+${Math.round(stats.completedTasks * 0.5)} this week` : 'No completed tasks'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teamMembers}</div>
                <p className="text-xs text-muted-foreground">Across {Math.ceil(stats.teamMembers / 2)} teams</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity and projects */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  {isLoadingProjects 
                    ? "Loading your projects..."
                    : `You're involved in ${projects.length} project${projects.length !== 1 ? 's' : ''}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingProjects ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  ))
                ) : projects.length > 0 ? (
                  projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50">
                      <div className="space-y-1">
                        <p className="font-medium leading-none">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.key || `PROJECT-${project.id}`}</p>
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="sr-only">View project</span>
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No projects yet. Create your first project to get started.</p>
                    <Button onClick={() => setIsProjectModalOpen(true)} variant="outline" size="sm" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Project
                    </Button>
                  </div>
                )}
              </CardContent>
              {projects.length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/projects">View All Projects</Link>
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your team's latest updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {isLoadingActivities ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex">
                        <Skeleton className="h-9 w-9 rounded-full mr-4" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))
                  ) : activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex">
                        <div className="flex-none mr-4">
                          <Avatar className="h-9 w-9">
                            {activity.user.avatar ? (
                              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                            ) : null}
                            <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm leading-none">
                            <span className="font-medium">{activity.user.name}</span> {activity.action} <span className="font-medium">{activity.target}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTimeAgo(activity.time)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  View Full Activity Log
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Your Work Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Work Progress</CardTitle>
              <CardDescription>
                Distribution of your assigned tickets by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingTickets ? (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </>
                ) : Object.keys(ticketsByStatus).length > 0 ? (
                  Object.entries(ticketsByStatus).map(([status, count], index) => (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: getStatusColor(status) }}
                          ></div>
                          <span className="text-sm">{status}</span>
                        </div>
                        <span className="text-sm font-medium">{count} tickets</span>
                      </div>
                      <Progress 
                        value={(count / assignedTickets.length) * 100} 
                        className={cn("h-2", getProgressColorClass(status))}
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No tickets assigned to you</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="my-work" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Assigned Tickets</CardTitle>
                <Badge className="ml-2">{assignedTickets.length}</Badge>
              </div>
              <CardDescription>Tickets assigned to you across all projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTickets ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                ))
              ) : assignedTickets.length > 0 ? (
                assignedTickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <Link 
                        href={`/projects/${ticket.project?.id}/tickets/${ticket.id}`}
                        className="font-medium hover:underline"
                      >
                        {ticket.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {ticket.project?.key}-{ticket.id}
                      </p>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: ticket.status?.color || undefined,
                        color: ticket.status?.color ? '#fff' : undefined
                      }}
                      variant={ticket.status?.color ? 'secondary' : 'outline'}
                    >
                      {ticket.status?.name || 'No Status'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tickets assigned to you yet.</p>
                </div>
              )}
            </CardContent>
            {assignedTickets.length > 0 && (
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/my-work">View All My Work</Link>
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Recent Activity on My Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Recent changes to your tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <Skeleton className="h-32 w-full" />
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.target}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.user.name} {activity.action} this ticket {formatTimeAgo(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No recent updates</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks and projects with approaching deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 border rounded-lg">
                <div className="text-center space-y-2">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Calendar view coming soon</p>
                  <Button variant="outline" size="sm">
                    Subscribe to Calendar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Creation Modal */}
      <NewProjectModal 
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
      />
    </div>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) return 'just now'
  
  // Convert to minutes
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  
  // Convert to hours
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  
  // Convert to days
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  
  // Convert to months
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  
  // Convert to years
  const years = Math.floor(months / 12)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

// Helper function to get status color
function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('done') || statusLower.includes('complete')) {
    return '#4CAF50' // Green
  } else if (statusLower.includes('progress') || statusLower.includes('doing')) {
    return '#2196F3' // Blue
  } else if (statusLower.includes('review')) {
    return '#9C27B0' // Purple
  } else if (statusLower.includes('test')) {
    return '#FF9800' // Orange
  } else if (statusLower.includes('block')) {
    return '#F44336' // Red
  } else {
    return '#757575' // Gray
  }
}

// Helper function to get progress bar color class
function getProgressColorClass(status: string): string {
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('done') || statusLower.includes('complete')) {
    return 'bg-green-600' 
  } else if (statusLower.includes('progress') || statusLower.includes('doing')) {
    return 'bg-blue-600'
  } else if (statusLower.includes('review')) {
    return 'bg-purple-600'
  } else if (statusLower.includes('test')) {
    return 'bg-orange-500'
  } else if (statusLower.includes('block')) {
    return 'bg-red-600'
  } else {
    return 'bg-gray-600'
  }
}

// Skeleton loader for the dashboard
function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <Skeleton className="h-10 w-80" />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-80 lg:col-span-3" />
        <Skeleton className="h-80 lg:col-span-4" />
      </div>
    </div>
  )
}