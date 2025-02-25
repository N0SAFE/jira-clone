'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@repo/ui/components/shadcn/command'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/ui/components/shadcn/dialog'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'
import { Input } from '@repo/ui/components/shadcn/input'
import { Label } from '@repo/ui/components/shadcn/label'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import Link from 'next/link'
import { useProjectsQuery } from '@/query&mutation/project'
import { useSession } from 'next-auth/react'
import { ProjectsProjectId } from '@/routes'
import { useProjectLoading } from '@/context/ProjectLoadingContext'

// Define project type
type Project = {
    id: string
    name: string
    logo?: React.ElementType
    plan?: string
}

type ProjectSwitcherProps = {
    projects?: Project[]
}

export function ProjectSwitcher({
    projects: initialProjects,
}: ProjectSwitcherProps) {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const { setLoading } = useProjectLoading()
    const [open, setOpen] = React.useState(false)
    const [showNewProjectDialog, setShowNewProjectDialog] =
        React.useState(false)

    // Find the current project based on the URL
    const currentProjectId = (params?.projectId as string) || '1'

    // Find the selected project from the list of projects
    const [selectedProject, setSelectedProject] =
        React.useState<Project | null>(null)

    const { data: projects = [], isLoading, error } = useProjectsQuery({
        params: [
            {
                filter: {
                    _or: [
                        // {
                        //     members: {
                        //         id: {
                        //             _eq: session?.user?.id,
                        //         },
                        //     },
                        // },
                        {
                            user_created: {
                                id: {
                                    _eq: session?.user?.id,
                                },
                            },
                        },
                    ],
                },
            },
        ],
    })

    // Set selected project based on URL parameter whenever projects or URL changes
    React.useEffect(() => {
        if (!projects?.length) return;
        
        // Always try to match the project from the URL first
        const projectFromUrl = projects.find(p => p.id === currentProjectId);
        
        if (projectFromUrl) {
            // If we find a matching project, select it
            setSelectedProject(projectFromUrl);
        } else if (!selectedProject && projects.length > 0) {
            // Only if we don't have a selected project yet and no matching URL project,
            // default to the first one
            setSelectedProject(projects[0]);
            
            // Optionally, update the URL to match the first project
            // if (projects[0].id) {
            //     ProjectsProjectId.immediate(router, { projectId: projects[0].id });
            // }
        }
    }, [projects, currentProjectId, selectedProject]);

    // Handle project creation
    const handleCreateProject = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const name = formData.get('name') as string
        const description = formData.get('description') as string

        if (!name) return

        try {
            // In a real app, you would call your API here
            // const response = await fetch('/api/projects', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ name, description }),
            // });
            // const newProject = await response.json();

            // For demo, simulate creating a project
            const newProject = {
                id: `new-${Date.now()}`,
                name,
                plan: 'New',
            }

            setSelectedProject(newProject)
            setShowNewProjectDialog(false)

            // Show loading state
            setLoading(true)
            
            // Navigate to the new project
            ProjectsProjectId.immediate(router, { projectId: newProject.id })
        } catch (error) {
            console.error('Error creating project:', error)
            // Add error handling as needed
            setLoading(false)
        }
    }

    // Handle project selection
    const handleSelectProject = (project: Project) => {
        // Don't do anything if it's the same project
        if (selectedProject?.id === project.id) {
            setOpen(false)
            return;
        }
        
        setSelectedProject(project)
        setOpen(false)
        
        // Show loading state
        setLoading(true)

        // Navigate to the selected project
        if (project.id) {
            ProjectsProjectId.immediate(router, { projectId: project.id })
        }
    }

    return (
        <Dialog
            open={showNewProjectDialog}
            onOpenChange={setShowNewProjectDialog}
        >
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Select a project"
                        className="w-full justify-between"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex w-full items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-[80px]" />
                            </div>
                        ) : selectedProject ? (
                            <div className="flex items-center gap-2 truncate">
                                {selectedProject.logo && (
                                    <selectedProject.logo className="h-4 w-4 shrink-0" />
                                )}
                                <span className="truncate">
                                    {selectedProject.name}
                                </span>
                                {selectedProject.plan && (
                                    <span className="text-muted-foreground ml-auto text-xs">
                                        {selectedProject.plan}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span>Select project</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Search projects..." />
                            {isLoading ? (
                                <div className="flex flex-col gap-1 p-2">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            ) : error ? (
                                <div className="text-muted-foreground p-2 text-center text-sm">
                                    {error && typeof error === 'object' 
                                        ? JSON.stringify(error) 
                                        : String(error)}
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty>
                                        No projects found.
                                    </CommandEmpty>
                                    <CommandGroup heading="Projects">
                                        {projects.map((project) => (
                                            <CommandItem
                                                key={project.id}
                                                onSelect={() =>
                                                    handleSelectProject(project)
                                                }
                                                className="text-sm"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    {project.logo && (
                                                        <project.logo className="h-4 w-4 shrink-0" />
                                                    )}
                                                    <span className="truncate">
                                                        {project.name}
                                                    </span>
                                                    {project.plan && (
                                                        <span className="text-muted-foreground ml-auto text-xs">
                                                            {project.plan}
                                                        </span>
                                                    )}
                                                </div>
                                                <Check
                                                    className={cn(
                                                        'ml-auto h-4 w-4',
                                                        selectedProject?.id ===
                                                            project.id
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <DialogTrigger asChild>
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false)
                                            setShowNewProjectDialog(true)
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Project
                                    </CommandItem>
                                </DialogTrigger>
                                <CommandItem asChild>
                                    <Link href="/projects" className="w-full">
                                        <span className="flex w-full items-center">
                                            All Projects
                                        </span>
                                    </Link>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <DialogContent>
                <form onSubmit={handleCreateProject}>
                    <DialogHeader>
                        <DialogTitle>Create project</DialogTitle>
                        <DialogDescription>
                            Add a new project to your workspace.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <div className="space-y-4 py-2 pb-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Acme Inc."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="Project description"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewProjectDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
