import { Sidebar } from '@/components/layout/Sidebar'
import { z } from 'zod'
import { Route } from './page.info'

export default async function Layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ [key in keyof z.infer<typeof Route.params>]: string }>
}) {
    const { projectId } = await params

    return (
        <div className="flex">
            <Sidebar projectId={Number(projectId)}>
                <div className="flex-1">{children}</div>
            </Sidebar>
        </div>
    )
}
