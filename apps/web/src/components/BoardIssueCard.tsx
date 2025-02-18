import { Draggable } from "@hello-pangea/dnd"
import { Issue } from "@/types"
import { cn } from "@repo/ui/lib/utils"
import { Card, CardContent } from "@repo/ui/components/shadcn/card"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar"
import { Badge } from "@repo/ui/components/shadcn/badge"
import { BookmarkIcon } from "lucide-react"

interface BoardIssueCardProps {
  issue: Issue
  index: number
}

const PRIORITY_COLORS = {
  highest: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  lowest: "bg-blue-500",
}

const TYPE_ICONS = {
  bug: "🐛",
  task: "📋",
  story: "📖",
  epic: "🏆",
}

export function BoardIssueCard({ issue, index }: BoardIssueCardProps) {
  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "hover:border-accent-foreground/20 transition-colors",
            snapshot.isDragging && "rotate-3"
          )}
        >
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span>{TYPE_ICONS[issue.type]}</span>
              <span className="text-sm font-medium flex-1">{issue.title}</span>
              <Badge variant="outline">{issue.key}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[issue.priority])} />
                {issue.assignee && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={issue.assignee.avatar} />
                    <AvatarFallback>{issue.assignee.name[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  )
}
