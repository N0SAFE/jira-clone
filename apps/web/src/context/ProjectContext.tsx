'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { Collections, Schema } from '@repo/directus-sdk/client'
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import directus from '@/lib/directus'
import { useProjectLoading } from './ProjectLoadingContext'
import { ApplyFields } from '@repo/directus-sdk/utils'
import { Query } from '@repo/directus-sdk/index'

export const fields = [
    '*',
    {
        owner: ['id', 'avatar', 'first_name', 'last_name'],
        user_created: ['id', 'avatar', 'first_name', 'last_name'],
        priorities: ['*'],
        statuses: ['*'],
        members: [
            'id',
            {
                directus_user: ['id', 'avatar', 'first_name', 'last_name'],
            },
        ],
    },
] as const satisfies Query<Schema, Collections.Projects>['fields']

export type ProjectContextType = UseQueryResult<
    ApplyFields<Collections.Projects, typeof fields>
> & {
    prefetch: (projectId: number) => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
    const params = useParams()
    const projectId = params?.projectId ? Number(params.projectId) : undefined

    const queryClient = useQueryClient()

    const query = useQuery({
        queryKey: ['projects', projectId, 'main'],
        queryFn: async () => {
            if (!projectId) throw new Error('No project ID')
            const data = await directus.Project.get(projectId, {
                fields,
                deep: {
                    statuses: {
                        _sort: "order",
                    }
                }
            })
            return data
        },
        enabled: !!projectId,
    })

    const prefetch = async (projectId: number) => {
        return queryClient.prefetchQuery({
            queryKey: ['projects', projectId, 'main'],
            queryFn: async () => {
                const data = await directus.Project.get(projectId, {
                    fields,
                    deep: {
                        statuses: {
                            _sort: "order",
                        }
                    }
                })
                return data
            },
        })
    }

    return (
        <ProjectContext.Provider value={{ ...query, prefetch }}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider')
    }
    return context
}
