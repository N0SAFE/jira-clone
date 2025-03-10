'use client'

import { BoardHeader } from '@/components/organisms/BoardHeader'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/shadcn/avatar'
import { Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { DirectusFile } from '@repo/ui/components/atomics/atoms/Directus/DirectusFile'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Collections } from '@repo/directus-sdk/client'

type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
};

export default function TeamPage() {
    const { data: session } = useSession()
    const { data: project } = useProject()

    const members = project?.members?.map((member) => {
        const user = member.directus_user
        if (!user || typeof user === 'string') return null

        return {
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email || '',
            role: user.role || 'Member',
            avatar: user.avatar,
        } as TeamMember
    }).filter((member): member is TeamMember => 
        member !== null
    ) || []

    // Setup real-time updates for project members
    useRealtimeUpdates({
        collection: 'project_members',
        queryKey: ['projects', project?.id, 'members'],
        showToast: true,
        toastMessages: {
            create: (data) => {
                const user = data.directus_user
                return `${user.first_name} ${user.last_name} joined the project`
            },
            delete: (data) => {
                const user = data.directus_user
                return `${user.first_name} ${user.last_name} left the project`
            }
        }
    })

    return (
        <div className="space-y-4 p-8 pt-6">
            <BoardHeader>
                <h2 className="text-3xl font-bold tracking-tight">
                    Team Members
                </h2>
                <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                </Button>
            </BoardHeader>

            <div className="rounded-md border">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between border-b p-4 last:border-b-0"
                    >
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <DirectusFile
                                    directus={directus}
                                    asset={member.avatar}
                                    accessToken={session?.access_token}
                                    render={({ url }) => (
                                        <AvatarImage
                                            src={url}
                                            alt={member.name}
                                        />
                                    )}
                                />
                                <AvatarFallback>
                                    {member.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {member.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {member.role}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
