// ProjectLoadingContext.tsx - Context for managing project loading state
'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ProjectLoadingContextType = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
};

const ProjectLoadingContext = createContext<ProjectLoadingContextType | undefined>(undefined);

export function ProjectLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <ProjectLoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </ProjectLoadingContext.Provider>
  );
}

export function useProjectLoading() {
  const context = useContext(ProjectLoadingContext);
  if (context === undefined) {
    throw new Error('useProjectLoading must be used within a ProjectLoadingProvider');
  }
  return context;
}