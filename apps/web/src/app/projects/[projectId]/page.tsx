'use client'

import { useQuery } from '@tanstack/react-query'
import { BoardHeader } from '@/components/organisms/BoardHeader'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Badge } from '@repo/ui/components/shadcn/badge'
import directus from '@/lib/directus'
import { useProject } from '@/context/ProjectContext'

export default function DashboardPage() {
    const { data: project } = useProject() ?? {}
    
    const { data: tickets = [] } = useQuery({
        queryKey: ['projects', project?.id, 'tickets'],
        queryFn: async () => {
            return directus.Tickets.query({
                filter: {
                    project: project?.id,
                },
            })
        },
        enabled: !!project?.id,
    })

    const ticketsByStatus = {
        draft:
            tickets?.filter((ticket) => ticket.status === 'draft')?.length || 0,
        published:
            tickets?.filter((ticket) => ticket.status === 'published')
                ?.length || 0,
        archived:
            tickets?.filter((ticket) => ticket.status === 'archived')?.length ||
            0,
    }

    return (
        <div className="space-y-4 p-8 pt-6">
            <BoardHeader>
                <h2 className="text-3xl font-bold tracking-tight">
                    {project?.name || 'Project Dashboard'}
                </h2>
                {project?.status && (
                    <Badge variant="secondary" className="ml-2">
                        {project.status}
                    </Badge>
                )}
            </BoardHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Draft Tickets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ticketsByStatus.draft}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Published Tickets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ticketsByStatus.published}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Archived Tickets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ticketsByStatus.archived}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tickets?.slice(0, 5).map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex items-center space-x-4"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm leading-none font-medium">
                                            {ticket.title}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            Created{' '}
                                            {ticket.date_created
                                                ? new Date(
                                                      ticket.date_created
                                                  ).toLocaleDateString()
                                                : 'Unknown'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Description
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {project?.description ||
                                        'No description provided'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Owner</p>
                                <p className="text-muted-foreground text-sm">
                                    {project?.owner
                                        ? `${project.owner.first_name} ${project.owner.last_name}`
                                        : 'Not assigned'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Created</p>
                                <p className="text-muted-foreground text-sm">
                                    {project?.date_created
                                        ? new Date(
                                              project.date_created
                                          ).toLocaleDateString()
                                        : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
