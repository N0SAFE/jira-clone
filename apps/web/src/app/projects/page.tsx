import { auth } from '@/lib/auth'
import directus from '@/lib/directus'
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query'
import { Projects } from './Projects'

export default async function ProjectsPage() {
    const session = await auth()

    if (!session) {
        throw new Error('Unauthorized')
    }

    if (!session.user) {
        throw new Error('Unauthorized')
    }

    const queryClient = new QueryClient()

    const params = [
        {
            filter: {
                user_created: {
                    _contains: session.user.id,
                },
            },
            fields: [
                'id',
                'name',
                {
                    owner: ['id', 'avatar', 'first_name', 'last_name'],
                },
            ],
        },
    ] as const

    await queryClient.prefetchQuery({
        queryKey: ['projects', ...params],
        queryFn: async () => {
            return directus.Projects.query(...params)
        },
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Projects />
        </HydrationBoundary>
    )
}
