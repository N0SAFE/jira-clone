import { Droppable } from "@hello-pangea/dnd"
import { Issue } from "@/types"
import { cn } from "@repo/ui/lib/utils"
import { BoardIssueCard } from "./BoardIssueCard"

interface BoardColumnProps {
  status: Issue["status"]
  issues: Issue[]
}

const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
}

const STATUS_COLORS = {
  todo: "bg-slate-100",
  in_progress: "bg-blue-50",
  review: "bg-yellow-50",
  done: "bg-green-50",
}

export function BoardColumn({ status, issues }: BoardColumnProps) {
  return (
    <div className={cn("rounded-lg p-4", STATUS_COLORS[status])}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{STATUS_LABELS[status]}</h3>
        <span className="text-sm text-muted-foreground">
          {issues.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "space-y-2 min-h-[200px]",
              snapshot.isDraggingOver && "bg-accent/50"
            )}
          >
            {issues.map((issue, index) => (
              <BoardIssueCard
                key={issue.id}
                issue={issue}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
