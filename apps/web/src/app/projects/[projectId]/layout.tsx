import { ProjectSidebar } from '@/components/layout/ProjectSidebar'
import { z } from 'zod'
import { Route } from './page.info'
import { ProjectLoadingProvider } from '@/context/ProjectLoadingContext'
import { ProjectLoadingOverlay } from '@/components/ProjectLoadingOverlay'
import { ProjectProvider } from '@/context/ProjectContext'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { auth } from '@/lib/auth'
import directus from '@/lib/directus'

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ [key in keyof z.infer<typeof Route.params>]: string }>
}) {
    const [{ projectId }, session] = await Promise.all([
        await params,
        await auth(),
    ])
    const queryClient = new QueryClient()

    const projectsParams = [
        {
            filter: {
                _or: [
                    {
                        user_created: {
                            id: {
                                _eq: session?.user?.id,
                            },
                        },
                    },
                ],
            },
        },
    ] as const

    await queryClient.prefetchQuery({
        queryKey: [...projectsParams],
        queryFn: async () => {
            return directus.Projects.query(...(projectsParams as any))
        },
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ProjectLoadingProvider>
                <ProjectProvider>
                    <div className="relative flex">
                        <ProjectSidebar projectId={Number(projectId)}>
                            <div className="relative flex-1">
                                <ProjectLoadingOverlay />
                                {children}
                            </div>
                        </ProjectSidebar>
                    </div>
                </ProjectProvider>
            </ProjectLoadingProvider>
        </HydrationBoundary>
    )
}
