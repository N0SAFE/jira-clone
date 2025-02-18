import { Card } from "@repo/ui/components/shadcn/card"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { useDraggable } from "@dnd-kit/core"
import { Issue } from "@/types/issue"

interface IssueCardProps {
  issue: Issue
}

export function IssueCard({ issue }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: issue.id,
    data: issue,
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
        <h4 className="text-sm font-medium">{issue.title}</h4>
        <Badge className={priorityColors[issue.priority]}>
          {issue.priority}
        </Badge>
      </div>
    </Card>
  )
}
