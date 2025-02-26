import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { Collections } from "@repo/directus-sdk/client"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"
import { BoardColumn } from "@/components/molecules/BoardColumn"

interface BoardProps {
  tickets: ApplyFields<Collections.Tickets, ['title', 'id', 'priority', 'status']>[]
  onDragEnd: (event: DragEndEvent) => void
  columns: Array<{
    id: string
    label: string
    enabled: boolean
  }>
}

export function Board({ tickets, onDragEnd, columns }: BoardProps) {
  // Filter out disabled columns and map tickets to enabled columns
  const enabledColumns = columns.filter(col => col.enabled)
  
  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enabledColumns.map((column) => (
          <BoardColumn
            key={column.id}
            id={column.id}
            title={column.label}
            tickets={tickets.filter((ticket) => ticket.status === column.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}