import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Collections } from "@repo/directus-sdk/client"
import { ApplyFields } from "@repo/directus-sdk/indirectus/utils"
import { BoardColumn } from "@/components/molecules/BoardColumn"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { useQueryClient } from '@tanstack/react-query'

interface BoardProps {
  tickets: ApplyFields<Collections.Tickets, ['title', 'id', {
    priority: ['color', 'id'],
    status: ['color', 'name', 'id'],
  }]>[]
  onDragEnd: (event: DragEndEvent) => void
  statuses: ApplyFields<Collections.TicketsStatuses>[]
}

export function Board({ tickets, onDragEnd, statuses }: BoardProps) {
  const queryClient = useQueryClient()

  // Setup real-time updates for tickets
  useRealtimeUpdates({
    collection: Collections.Tickets,
    queryKey: ['tickets'],
    showToast: false,
    toastMessages: {
      update: (data) => `Ticket "${data.title}" has been updated`
    }
  })

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
  
  return (
    <DndContext 
      onDragEnd={onDragEnd}
      sensors={sensors}
      modifiers={[snapCenterToCursor]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((status) => (
          <BoardColumn
            key={status.id}
            id={status.id}
            title={status.name}
            tickets={tickets.filter((ticket) => ticket.status.id === status.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}