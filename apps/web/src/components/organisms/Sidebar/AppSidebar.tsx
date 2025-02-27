"use client"

import * as React from "react"
import { useParams, usePathname } from "next/navigation"
import {
  KanbanSquare,
  Folder,
  Settings,
  Users,
  Ticket
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@repo/ui/components/shadcn/sidebar"
import { NavMain } from "./NavMain"
import { ProjectSwitcher } from "./ProjectSwitcher"
import { 
  ProjectsProjectId, 
  ProjectsProjectIdBoard, 
  ProjectsProjectIdSettings, 
  ProjectsProjectIdTeam,
  ProjectsProjectIdTickets
} from "@/routes"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  
  // Extract the projectId from URL params or fallback to "1"
  const projectId = Number(params?.projectId)
  
  // Determine which section is active based on the pathname
  const isActiveSection = (section: string) => {
    if (!section) {
      // For overview (project root)
      return pathname === `/projects/${projectId}`;
    }
    return pathname.includes(`/projects/${projectId}/${section}`);
  };

  // Create navigation items based on current project
  const navigationItems = [
    {
      title: "Overview",
      url: ProjectsProjectId({ projectId }),
      icon: Folder,
      isActive: isActiveSection(""),
    },
    {
      title: "Board",
      url: ProjectsProjectIdBoard({ projectId }),
      icon: KanbanSquare,
      isActive: isActiveSection("board"),
    },
    {
      title: "Tickets",
      url: ProjectsProjectIdTickets({ projectId }),
      icon: Ticket,
      isActive: isActiveSection("tickets"),
    },
    {
      title: "Team",
      url: ProjectsProjectIdTeam({ projectId }),
      icon: Users,
      isActive: isActiveSection("team"),
    },
    {
      title: "Settings",
      url: ProjectsProjectIdSettings({ projectId }),
      icon: Settings,
      isActive: isActiveSection("settings"),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
