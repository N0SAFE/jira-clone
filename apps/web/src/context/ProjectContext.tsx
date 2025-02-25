'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { useProjectQuery } from '@/query&mutation/project'
import { Collections } from '@repo/directus-sdk/client'

type DirectusUser = {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    role: string | null
    avatar: string | null
}

type ProjectType = Omit<Collections.Projects, 'owner' | 'members'> & {
    owner?: DirectusUser
    members?: Array<{
        directus_user: DirectusUser | null
    }>
}

type ProjectContextType = {
    project: ProjectType | null
    isLoading: boolean
    error: Error | null
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { projectId } = useParams<{ projectId: string }>()

    const {
        data: rawProject,
        isLoading,
        error,
    } = useProjectQuery({
        params: [
            Number(projectId),
            {
                fields: [
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
                ],
            },
        ],
    })

    // Transform the raw project data to match our expected types
    const project = rawProject
        ? ({
              ...rawProject,
              owner:
                  typeof rawProject.owner === 'string'
                      ? undefined
                      : rawProject.owner,
              members: rawProject.members?.map((member) => ({
                  ...member,
                  directus_user:
                      typeof member.directus_user === 'string'
                          ? null
                          : member.directus_user,
              })),
          } as ProjectType)
        : null

    return (
        <ProjectContext.Provider
            value={{
                project,
                isLoading,
                error: error as Error | null,
            }}
        >
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
