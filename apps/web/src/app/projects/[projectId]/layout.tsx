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
import type * as Directus from '@directus/sdk'
import { Schema, Collections } from '@repo/directus-sdk/client'

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
            fields: [
                '*',
                {
                    owner: ['id', 'avatar', 'first_name', 'last_name'],
                    user_created: ['id', 'avatar', 'first_name', 'last_name'],
                    priorities: ['*'],
                    statuses: ['*'],
                    members: ['id', {
                        directus_user: ['id', 'avatar', 'first_name', 'last_name'],
                    }],
                },
            ]
        },
    ] satisfies [Directus.Query<Schema, Collections.Projects>]

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
                    <div className="relative flex h-full overflow-hidden">
                        <ProjectSidebar projectId={Number(projectId)}>
                            <div className="relative flex-1 h-full">
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
