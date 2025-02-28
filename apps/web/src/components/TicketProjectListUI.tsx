'use client'

import Link from 'next/link'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Button } from '@repo/ui/components/shadcn/button'
import { Collections } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/indirectus/utils'
import { ProjectsProjectId } from '@/routes'

const getStatusColor = (status: any) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
    // Handle case when status is an object with a name property
    if (typeof status === 'object' && status !== null) {
        if (status.name) {
            const statusName = status.name.toLowerCase();
            const statusColors: Record<string, string> = {
                open: 'bg-green-100 text-green-800',
                closed: 'bg-gray-100 text-gray-800',
                in_progress: 'bg-blue-100 text-blue-800',
                blocked: 'bg-red-100 text-red-800',
                pending: 'bg-yellow-100 text-yellow-800',
                todo: 'bg-purple-100 text-purple-800',
                done: 'bg-green-100 text-green-800',
            }
            return statusColors[statusName] || 'bg-gray-100 text-gray-800'
        }
        
        // If status has a color property, use it directly
        if (status.color) {
            return `bg-opacity-20 text-opacity-90 bg-${status.color} text-${status.color}`
        }
        
        return 'bg-gray-100 text-gray-800'
    }
    
    // Handle string status (original behavior)
    if (typeof status === 'string') {
        const statusColors: Record<string, string> = {
            open: 'bg-green-100 text-green-800',
            closed: 'bg-gray-100 text-gray-800',
            in_progress: 'bg-blue-100 text-blue-800',
            blocked: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
            todo: 'bg-purple-100 text-purple-800',
            done: 'bg-green-100 text-green-800',
        }
        return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
    }
    
    return 'bg-gray-100 text-gray-800'
}

const getPriorityBadge = (priority: string | any) => {
    // Handle case when priority is null or undefined
    if (!priority) {
        return { color: 'bg-gray-100 text-gray-800', label: 'None' };
    }
    
    // Handle case when priority is an object with a name property
    if (typeof priority === 'object' && priority !== null) {
        if (priority.name) {
            const priorityName = priority.name.toLowerCase();
            const priorities: Record<string, { color: string; label: string }> = {
                high: { color: 'bg-red-100 text-red-800', label: 'High' },
                medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
                low: { color: 'bg-blue-100 text-blue-800', label: 'Low' },
            };
            return priorities[priorityName] || { 
                color: priority.color ? `bg-opacity-20 text-opacity-90 bg-${priority.color} text-${priority.color}` : 'bg-gray-100 text-gray-800',
                label: priority.name 
            };
        }
        
        return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
    
    // Handle string priority (original behavior)
    if (typeof priority === 'string') {
        const priorities: Record<string, { color: string; label: string }> = {
            high: { color: 'bg-red-100 text-red-800', label: 'High' },
            medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
            low: { color: 'bg-blue-100 text-blue-800', label: 'Low' },
        };
        return priorities[priority.toLowerCase()] || {
            color: 'bg-gray-100 text-gray-800',
            label: priority,
        };
    }
    
    return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
}

const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString()
}

interface TicketProjectListProps {
    tickets: ApplyFields<
        Collections.Tickets,
        ['project', 'id', 'title', 'status', 'priority', 'date_updated']
    >[]
    projects: ApplyFields<
        Collections.Projects,
        ['id', 'name', 'status', 'date_updated']
    >[]
}

export default function TicketProjectListUI({
    tickets,
    projects,
}: TicketProjectListProps) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>My Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <Link
                                    href={`/${ticket.project}/tickets/${ticket.id}`}
                                    key={ticket.id}
                                    className="block"
                                >
                                    <div className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                                        <div className="space-y-1">
                                            <h3 className="font-medium">
                                                {ticket.title}
                                            </h3>
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Badge
                                                    variant="secondary"
                                                    className={getStatusColor(
                                                        ticket.status
                                                    )}
                                                >
                                                    {ticket.status}
                                                </Badge>
                                                {ticket.priority && (
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            getPriorityBadge(
                                                                ticket.priority
                                                            ).color
                                                        }
                                                    >
                                                        {
                                                            getPriorityBadge(
                                                                ticket.priority
                                                            ).label
                                                        }
                                                    </Badge>
                                                )}
                                                {ticket.date_updated && (
                                                    <span className="text-muted-foreground">
                                                        Updated:{' '}
                                                        {formatDate(
                                                            ticket.date_updated
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {tickets.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    No tickets found
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects.map((project) => (
                                <ProjectsProjectId.Link
                                    projectId={project.id}
                                    key={project.id}
                                    className="block"
                                >
                                    <div className="hover:bg-accent/50 group flex items-center justify-between rounded-lg border p-4 transition-colors">
                                        <div className="space-y-1">
                                            <h3 className="font-medium">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 text-sm">
                                                {project.status && (
                                                    <Badge
                                                        variant="secondary"
                                                        className={getStatusColor(
                                                            project.status
                                                        )}
                                                    >
                                                        {project.status}
                                                    </Badge>
                                                )}
                                                {project.date_updated && (
                                                    <span className="text-muted-foreground">
                                                        Updated:{' '}
                                                        {formatDate(
                                                            project.date_updated
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="opacity-0 transition-opacity group-hover:opacity-100"
                                        >
                                            View Project
                                        </Button>
                                    </div>
                                </ProjectsProjectId.Link>
                            ))}
                            {projects.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    No projects found
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
