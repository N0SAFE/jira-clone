import { Card, CardContent } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { Collections } from "@repo/directus-sdk/client"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@repo/ui/lib/utils"

interface TicketCardProps {
  ticket: ApplyFields<Collections.Tickets, ['title', 'id', 'priority', 'status']>
}

const PRIORITY_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500"
}

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-red-100 text-red-800"
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: ticket.id,
  })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <Card className={cn(
        "hover:border-border/50 transition-colors cursor-grab active:cursor-grabbing",
        isDragging && "rotate-3",
        transform ? "translate3d(" + transform.x + "px, " + transform.y + "px, 0)" : ""
      )}>
        <CardContent className="p-3 space-y-3">
          <h3 className="font-medium text-sm">{ticket.title}</h3>
          
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[ticket.priority])} />
            <Badge variant="secondary" className={STATUS_COLORS[ticket.status]}>
              {ticket.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
