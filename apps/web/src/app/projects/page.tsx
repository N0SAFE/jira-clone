import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { BoardHeader } from '@/components/organisms/BoardHeader'
import { auth } from '@/lib/auth'
import directus from '@/lib/directus'
import { ProjectsProjectId } from '@/routes'

export default async function ProjectsPage() {
    const session = await auth()

    if (!session) {
        throw new Error('Unauthorized')
    }

    if (!session.user) {
        throw new Error('Unauthorized')
    }

    const projects = await directus.Projects.query({
        filter: {
            user_created: {
                _contains: session.user.id,
            },
        },
        fields: ['*', 'date_created', 'date_updated', 'status'],
    })

    return (
        <div className="space-y-4 p-8 pt-6">
            <BoardHeader>
                <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </BoardHeader>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.id}>
                        <CardHeader>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>
                                {project.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">
                                    Created {project.date_created}
                                </span>
                                <ProjectsProjectId.Link projectId={project.id}>
                                    View
                                </ProjectsProjectId.Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
