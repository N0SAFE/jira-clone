'use client'

import { useProject } from '@/context/ProjectContext'
import { ProjectSettingsForm } from '@/components/forms/ProjectSettingsForm'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import directus from '@/lib/directus'
import { useToast } from '@repo/ui/hooks/use-toast'
import { Collections, Schema } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/utils'

interface BoardSettings {
    columns: Array<{
        id: string
        label: string
        enabled: boolean
    }>
}

type ProjectSettings = ApplyFields<Collections.ProjectsSettings>

type ProjectSettingsCreatePayload = {
    project: Collections.Projects['id']
    status: 'active'
    board_settings: BoardSettings
}

export default function ProjectSettingsPage() {
    const project = useProject()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const { data: settings } = useQuery<ProjectSettings | null>({
        queryKey: ['projects', project?.data?.id, 'settings'],
        queryFn: async () => {
            if (!project?.data?.id) return null
            try {
                const result = await directus.ProjectsSettings.find({
                    filter: {
                        _and: [
                            {
                                statuses: {
                                    _some: [
                                        {
                                            name: { _eq: 'active' },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                })
                return result && Array.isArray(result) && result.length > 0
                    ? result[0]
                    : null
            } catch (error) {
                console.error('Error fetching settings:', error)
                return null
            }
        },
        enabled: !!project?.data?.id,
    })

    const updateSettings = useMutation({
        mutationFn: async (data: BoardSettings) => {
            if (!project?.data?.id) return null
            const payload: ProjectSettingsCreatePayload = {
                project: project.data.id,
                status: 'active',
                board_settings: data,
            }
            try {
                if (settings?.id) {
                    return directus.ProjectsSetting.update(settings.id, {
                        project: project.data.id,
                        // @ts-expect-error
                        statuses: [
                            {
                                name: 'active',
                            },
                            ...settings.statuses,
                        ],
                    })
                } else {
                    return directus.ProjectsSetting.create({
                        project: project.data.id,
                        statuses: [
                            // @ts-expect-error
                            {
                                name: 'active',
                                sort: 1,
                            },
                        ],
                    })
                }
            } catch (error) {
                console.error('Error updating settings:', error)
                throw error
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['projects', project?.data?.id, 'settings'],
            })
            toast({
                title: 'Settings updated',
                description:
                    'Your board settings have been saved successfully.',
            })
        },
    })

    if (!project?.data) return null

    return (
        <div className="space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">
                Project Settings
            </h2>
            <ProjectSettingsForm
                project={project.data}
                defaultValues={settings?.board_settings}
                onSubmit={updateSettings.mutate}
            />
        </div>
    )
}
