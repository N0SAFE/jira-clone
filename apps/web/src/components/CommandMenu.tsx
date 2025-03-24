'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@repo/ui/components/shadcn/command'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
    Search,
    FileText,
    Users,
    Settings as SettingsIcon,
    LayoutDashboard,
    Clock,
    Bookmark,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ChevronRight,
} from 'lucide-react'
import directus from '@/lib/directus'
import { Projects, Dashboard, Settings, Profile } from '@/routes'

interface CommandMenuProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
    const router = useRouter()
    const { data: session } = useSession()

    // Handle keyboard shortcut to open command menu
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
                e.preventDefault()
                onOpenChange(true)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [onOpenChange])

    // Fetch recent projects
    const { data: recentProjects = [] } = useQuery({
        queryKey: ['recent-projects'],
        queryFn: async () => {
            // In a real app, you'd fetch actual data from the API
            return directus.Projects.query({
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
                limit: 5,
            })
        },
        enabled: open && !!session,
    })

    // Fetch recent tickets
    const { data: recentTickets = [] } = useQuery({
        queryKey: ['recent-tickets'],
        queryFn: async () => {
            // In a real app, you'd fetch actual data from the API
            return directus.Tickets.query({
                filter: {
                    user_created: {
                        id: {
                            _eq: session?.user?.id,
                        },
                    },
                },
                limit: 5,
                fields: [
                    '*',
                    {
                        project: ['*'],
                    },
                ],
            })
        },
        enabled: open && !!session,
    })

    // Run a command when selected
    const runCommand = (command: () => void) => {
        onOpenChange(false)
        command()
    }

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                {/* Quick links */}
                <CommandGroup heading="Quick Links">
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => Dashboard.immediate(router))
                        }
                    >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => Projects.immediate(router))
                        }
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Projects</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => Profile.immediate(router))
                        }
                    >
                        <Users className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => Settings.immediate(router))
                        }
                    >
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                {/* Recent Projects */}
                <CommandGroup heading="Recent Projects">
                    {recentProjects.map((project) => (
                        <CommandItem
                            key={project.id}
                            onSelect={() =>
                                runCommand(() =>
                                    router.push(`/projects/${project.id}`)
                                )
                            }
                        >
                            <Bookmark className="mr-2 h-4 w-4" />
                            <span>{project.name}</span>
                            <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 text-xs">
                                {project.key}
                            </span>
                        </CommandItem>
                    ))}
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => router.push('/projects'))
                        }
                    >
                        <ChevronRight className="mr-2 h-4 w-4" />
                        <span className="text-muted-foreground">
                            View all projects
                        </span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                {/* Recent Tickets */}
                <CommandGroup heading="Recent Tickets">
                    {recentTickets.map((ticket) => (
                        <CommandItem
                            key={ticket.id}
                            onSelect={() =>
                                runCommand(() =>
                                    router.push(
                                        `/projects/${ticket.project}/tickets/${ticket.id}`
                                    )
                                )
                            }
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            <span>{ticket.title}</span>
                            <span className="bg-muted text-muted-foreground ml-2 rounded px-1.5 text-xs">
                                {ticket.project?.key}-{ticket.id}
                            </span>
                        </CommandItem>
                    ))}
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => router.push('/assigned'))
                        }
                    >
                        <ChevronRight className="mr-2 h-4 w-4" />
                        <span className="text-muted-foreground">
                            View all my tickets
                        </span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                {/* Actions */}
                <CommandGroup heading="Actions">
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => router.push('/projects/new'))
                        }
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Create new project</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() =>
                            runCommand(() =>
                                router.push('/projects/1/tickets/new')
                            )
                        }
                    >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <span>Create new ticket</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() =>
                            runCommand(() => router.push('/calendar'))
                        }
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>View calendar</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
