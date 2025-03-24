import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import directus from '@/lib/directus'

export default async function TicketProjectList() {
    const session = await auth()

    const [tickets, projects] = await Promise.all([
        directus.Tickets.query({
            filter: {
                user_created: {
                    id: {
                        _eq: session?.user?.id,
                    },
                },
            },
            fields: [
                '*',
                {
                    project: ['id', 'name', 'description'],
                    priority: ['id', 'name', 'color'],
                    status: ['id', 'name', 'color'],
                    user_created: ['id', 'avatar', 'first_name', 'last_name'],
                    assigned_to: ['id', 'avatar', 'first_name', 'last_name'],
                },
            ],
        }),
        directus.Projects.query({
            filter: {
                _or: [
                    {
                        members: {
                            directus_user: {
                                id: {
                                    _eq: session?.user?.id,
                                },
                            },
                        },
                    },
                    {
                        owner: {
                            id: {
                                _eq: session?.user?.id,
                            },
                        },
                    },
                ],
            },
            fields: [
                '*',
                {
                    owner: ['id', 'avatar', 'first_name', 'last_name'],
                    user_created: ['id', 'avatar', 'first_name', 'last_name'],
                    priorities: ['*'],
                    statuses: ['*'],
                    members: [
                        'id',
                        {
                            directus_user: [
                                'id',
                                'avatar',
                                'first_name',
                                'last_name',
                            ],
                        },
                    ],
                },
            ],
            alias: {
                completedTickets: 'tickets',
                ticketsCount: 'tickets',
            },
        }),
    ])

    return (
        <div className="flex w-full gap-4">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>My Tickets</CardTitle>
                    <CardDescription>
                        Your recently assigned tickets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tickets.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">
                                No tickets assigned to you
                            </p>
                        ) : (
                            tickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/projects/${ticket.project?.id}/tickets/${ticket.id}`}
                                    className="block"
                                >
                                    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-muted-foreground font-mono text-sm">
                                                    {ticket.id}
                                                </span>
                                                <h4 className="font-medium">
                                                    {ticket.title}
                                                </h4>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-muted-foreground text-sm">
                                                    {ticket.project?.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge
                                                style={{
                                                    backgroundColor:
                                                        ticket.status.color,
                                                }}
                                                variant="secondary"
                                            >
                                                {ticket.status.name}
                                            </Badge>
                                            <Badge
                                                style={{
                                                    backgroundColor:
                                                        ticket.priority.color,
                                                }}
                                                variant="secondary"
                                            >
                                                {ticket.priority.name}
                                            </Badge>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="flex-1">
                <CardHeader>
                    <CardTitle>My Projects</CardTitle>
                    <CardDescription>
                        Projects you are working on
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {projects.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">
                                No projects assigned to you
                            </p>
                        ) : (
                            projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="block"
                                >
                                    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                                        <div className="space-y-1">
                                            <h4 className="font-medium">
                                                {project.name}
                                            </h4>
                                            <p className="text-muted-foreground text-sm">
                                                {project.description}
                                            </p>
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            {NaN}/{NaN} tasks completed
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
