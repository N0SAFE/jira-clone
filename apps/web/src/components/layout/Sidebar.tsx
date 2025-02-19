'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@repo/ui/lib/utils'
import { LayoutDashboard, ListTodo, Settings, Users, Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@repo/ui/components/shadcn/sheet'
import {
    ProjectsProjectId,
    ProjectsProjectIdBoard,
    ProjectsProjectIdSettings,
    ProjectsProjectIdTeam,
} from '@/routes'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    projectId: number
}

export function Sidebar({ className, projectId }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: ProjectsProjectId({
                projectId,
            }),
            color: 'text-sky-500',
        },
        {
            label: 'Board',
            icon: ListTodo,
            href: ProjectsProjectIdBoard({
                projectId,
            }),
            color: 'text-violet-500',
        },
        {
            label: 'Team',
            icon: Users,
            color: 'text-pink-700',
            href: ProjectsProjectIdTeam({
                projectId,
            }),
        },
        {
            label: 'Settings',
            icon: Settings,
            href: ProjectsProjectIdSettings({
                projectId,
            }),
        },
    ]

    return (
        <div className={cn('min-h-screen w-64 border-r pb-12', className)}>
            <div className="space-y-4 py-4">
                <div className="px-4 py-2">
                    <Button className="w-full justify-start" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Overview
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    'hover:bg-accent hover:text-accent-foreground flex items-center rounded-lg px-3 py-2 text-sm font-medium',
                                    pathname === route.href
                                        ? 'bg-accent text-accent-foreground'
                                        : 'transparent'
                                )}
                            >
                                <route.icon
                                    className={cn('mr-2 h-4 w-4', route.color)}
                                />
                                {route.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MobileSidebar({ projectId }: { projectId: number }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <LayoutDashboard className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <Sidebar projectId={projectId} />
            </SheetContent>
        </Sheet>
    )
}
