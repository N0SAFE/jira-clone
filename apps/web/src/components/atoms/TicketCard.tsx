"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Collections } from "@repo/directus-sdk/client"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@repo/ui/lib/utils"
import type { CSSProperties } from 'react'
import { useParams } from 'next/navigation'
import { ProjectsProjectIdTicketsTicketId } from '@/routes/index'

interface TicketCardProps {
  ticket: ApplyFields<Collections.Tickets, ['title', 'id', {
    priority: ['color', 'id'],
    status: ['color', 'name', 'id']
  }]>
}

export function TicketCard({ ticket }: TicketCardProps) {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  })

  const style: CSSProperties = {
    transform: transform ? 
      `translate3d(${transform.x}px, ${transform.y}px, 0)` : 
      undefined,
    transition: 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1), rotate 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  }

  const handleClick = () => {
    if (!isDragging) {
      ProjectsProjectIdTicketsTicketId.immediate(router, { projectId: Number(projectId), ticketId: ticket.id })
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners}>
        <div onClick={handleClick}>
          <Card className={cn(
            "hover:border-border/50 transition-all duration-200 ease-out cursor-pointer transform",
            isDragging ? "rotate-3 opacity-80 shadow-lg scale-105" : "rotate-0"
          )}>
            <CardContent className="p-3 space-y-3">
              <h3 className="font-medium text-sm">{ticket.title}</h3>
              
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full")} style={{
                  backgroundColor: ticket.priority.color
                }} />
                <Badge variant="secondary" style={{
                  backgroundColor: ticket.status.color
                }}>
                  {ticket.status.name}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
