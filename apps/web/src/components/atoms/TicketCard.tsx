import { Card } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { useDraggable } from "@dnd-kit/core"
import { Issue } from "@/types/issue"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"
import { Collections } from "@repo/directus-sdk/client"

interface TicketCardProps {
  ticket: ApplyFields<Collections.Tickets, ['title', 'id', 'priority']>
}

export function TicketCard({ ticket }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
    data: ticket,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="p-4 cursor-grab active:cursor-grabbing"
      {...listeners} 
      {...attributes}
    >
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{ticket.title}</h4>
        <Badge className={priorityColors[ticket.priority]}>
          {ticket.priority}
        </Badge>
      </div>
    </Card>
  )
}
