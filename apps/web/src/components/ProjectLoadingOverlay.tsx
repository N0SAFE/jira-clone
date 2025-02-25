// ProjectLoadingOverlay.tsx - Loading overlay for project content
'use client'

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useProjectLoading } from '@/context/ProjectLoadingContext';
import { cn } from '@repo/ui/lib/utils';

export function ProjectLoadingOverlay() {
  const { isLoading } = useProjectLoading();

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    </div>
  );
}