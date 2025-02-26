'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { Collections } from '@repo/directus-sdk/client'
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import directus from '@/lib/directus'
import { useProjectLoading } from './ProjectLoadingContext'
import { ApplyFields } from '@repo/directus-sdk/utils'

export const fields = [
    'id',
    'name',
    'description',
    'status',
    'date_created',
    'date_updated',
    {
        user_created: [
            'id',
            'first_name',
            'last_name',
            'email',
            'role',
            'avatar',
        ],
    },
    {
        owner: [
            'id',
            'first_name',
            'last_name',
            'email',
            'role',
            'avatar',
        ],
    },
    {
        members: [
            'id',
            {
                directus_user: [
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'role',
                    'avatar',
                ],
            },
        ],
    },
] as const

const ProjectContext = createContext<
    | (UseQueryResult<ApplyFields<Collections.Projects, typeof fields>> & {
          prefetch: (projectId: number) => Promise<void>
      })
    | null
>(null)

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
