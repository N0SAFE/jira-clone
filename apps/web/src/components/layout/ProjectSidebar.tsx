'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@repo/ui/components/shadcn/sheet'
import { Separator } from '@repo/ui/components/shadcn/separator'
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@repo/ui/components/shadcn/sidebar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@repo/ui/components/shadcn/breadcrumb'
import { AppSidebar } from '../organisms/Sidebar/AppSidebar'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    projectId: number
}

export function ProjectSidebar({
    children,
    projectId,
}: SidebarProps) {
    const pathname = usePathname()
    
    // Extract breadcrumb info from pathname
    const getBreadcrumbInfo = () => {
        // Default values
        let projectName = "Project";
        let currentSection = "";
        
        // Check if we're in a project route
        if (pathname.startsWith('/projects/')) {
            // Split the path to get project ID and section
            const pathParts = pathname.split('/').filter(Boolean);
            
            // If we have a project ID (at least /projects/[id])
            if (pathParts.length >= 2) {
                projectName = `Project ${pathParts[1]}`;
                
                // If we have a section (like /projects/[id]/board)
                if (pathParts.length >= 3) {
                    currentSection = pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1);
                } else {
                    currentSection = "Overview";
                }
            }
        }
        
        return { projectName, currentSection };
    }
    
    const { projectName, currentSection } = getBreadcrumbInfo();

    return (
        <div className="flex h-full w-full">
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                orientation="vertical"
                                className="mr-2 h-4"
                            />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href={`/projects/${projectId}`}>
                                            {projectName}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {currentSection && (
                                        <>
                                            <BreadcrumbSeparator className="hidden md:block" />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>
                                                    {currentSection}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    )}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </div>
    )
}

export function MobileSidebar({
    projectId,
    children,
}: React.PropsWithChildren<{ projectId: number }>) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <LayoutDashboard className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <ProjectSidebar projectId={projectId}>{children}</ProjectSidebar>
            </SheetContent>
        </Sheet>
    )
}
