import { Settings } from "lucide-react"
import { Button } from "@repo/ui/components/shadcn/button"
import Link from "next/link"
import { useState } from "react"

interface BoardHeaderProps {
  projectId: string
  title: string
  children?: React.ReactNode
}

export function BoardHeader({ projectId, title, children }: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {children}
      </div>
      <Link href={`/projects/${projectId}/settings`}>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}