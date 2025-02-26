import { Card } from "@repo/ui/components/shadcn/card"
import { TicketCard } from "../atoms/TicketCard"
import { useDroppable } from "@dnd-kit/core"
import { Issue } from "@/types/issue"
import { Collections } from "@repo/directus-sdk/client"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"

interface BoardColumnProps {
  title: string
  tickets: ApplyFields<Collections.Tickets, ['title', 'id', 'priority', 'status']>[]
  id: string
}

export function BoardColumn({ title, tickets, id }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs">
          {tickets.length}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className={`flex flex-col gap-2 p-2 rounded-lg min-h-[200px] transition-colors ${
          isOver ? "bg-secondary/50" : "bg-secondary/10"
        }`}
      >
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  )
}
