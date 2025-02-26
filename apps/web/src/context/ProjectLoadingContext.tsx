'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface ProjectLoadingContextType {
    isLoading: boolean
    setLoading: (loading: boolean) => void
}

const ProjectLoadingContext = createContext<ProjectLoadingContextType | undefined>(
    undefined
)

export function ProjectLoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setLoading] = React.useState(false)

    return (
        <ProjectLoadingContext.Provider
            value={{
                isLoading,
                setLoading,
            }}
        >
            {children}
        </ProjectLoadingContext.Provider>
    )
}

export function useProjectLoading() {
    const context = useContext(ProjectLoadingContext)
    if (context === undefined) {
        throw new Error(
            'useProjectLoading must be used within a ProjectLoadingProvider'
        )
    }
    return context
}