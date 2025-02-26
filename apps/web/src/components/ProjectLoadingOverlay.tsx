// ProjectLoadingOverlay.tsx - Loading overlay for project content
'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useProject } from '@/context/ProjectContext'
import { useProjectLoading } from '@/context/ProjectLoadingContext'

export function ProjectLoadingOverlay() {
    const { isLoading } = useProjectLoading()

    return (
        <div
            className={cn(
                'bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity duration-300',
                isLoading ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
        >
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="text-primary h-10 w-10 animate-spin" />
                <p className="text-muted-foreground text-sm">
                    Loading project...
                </p>
            </div>
        </div>
    )
}
