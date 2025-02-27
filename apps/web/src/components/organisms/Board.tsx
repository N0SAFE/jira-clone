import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Collections } from "@repo/directus-sdk/client"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"
import { BoardColumn } from "@/components/molecules/BoardColumn"
import {  snapCenterToCursor } from "@dnd-kit/modifiers"

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
  // Configure sensors for better touch/mouse handling
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10, // 10px movement before drag starts
    },
  })
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Wait 250ms before drag starts
      tolerance: 5, // Allow 5px movement before canceling
    },
  })

  const sensors = useSensors(mouseSensor, touchSensor)

  // Filter out disabled columns and map tickets to enabled columns
  const enabledColumns = columns.filter(col => col.enabled)
  
  return (
    <DndContext 
      onDragEnd={onDragEnd}
      sensors={sensors}
      modifiers={[snapCenterToCursor]}
    >
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