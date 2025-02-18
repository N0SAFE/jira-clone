import { Card } from "@repo/ui/components/shadcn/card"
import { IssueCard } from "../atoms/IssueCard"
import { useDroppable } from "@dnd-kit/core"
import { Issue } from "@/types/issue"

interface BoardColumnProps {
  title: string
  issues: Issue[]
  id: string
}

export function BoardColumn({ title, issues, id }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="rounded-full bg-secondary px-2 py-1 text-xs">
          {issues.length}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className={`flex flex-col gap-2 p-2 rounded-lg min-h-[200px] transition-colors ${
          isOver ? "bg-secondary/50" : "bg-secondary/10"
        }`}
      >
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  )
}
