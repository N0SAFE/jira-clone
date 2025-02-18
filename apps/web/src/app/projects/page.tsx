"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@repo/ui/components/shadcn/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card"
import { BoardHeader } from "@/components/organisms/BoardHeader"

const mockProjects = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Redesigning the company website",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Mobile App",
    description: "Developing a new mobile application",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState(mockProjects)

  return (
    <div className="space-y-4 p-8 pt-6">
      <BoardHeader>
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </BoardHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Created {project.createdAt.toLocaleDateString()}
                </span>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
