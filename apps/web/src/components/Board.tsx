"use client"

import { useState } from "react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { Plus } from "lucide-react"
import { Issue } from "@/types"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/shadcn/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select"
import { BoardColumn } from "./BoardColumn"
import { BoardHeader } from "./organisms/BoardHeader"
import { useUpdateIssue } from "@/hooks/useIssues"

interface BoardProps {
  projectId: string
  issues: Issue[]
}

const VIEW_TYPES = [
  { label: "Kanban Board", value: "kanban" },
  { label: "List View", value: "list" },
]

export function Board({ projectId, issues }: BoardProps) {
  const [view, setView] = useState("kanban")
  const { mutate: updateIssue } = useUpdateIssue(projectId)

  const columns = {
    todo: issues.filter(issue => issue.status === "todo"),
    in_progress: issues.filter(issue => issue.status === "in_progress"),
    review: issues.filter(issue => issue.status === "review"),
    done: issues.filter(issue => issue.status === "done"),
  }

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const issue = issues.find(i => i.id === draggableId)
    if (!issue) return

    updateIssue({
      id: draggableId,
      status: destination.droppableId as Issue["status"],
    })
  }

  return (
    <div className="space-y-4">
      <BoardHeader>
        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {VIEW_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Issue
          </Button>
        </div>
      </BoardHeader>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(columns).map(([status, items]) => (
            <BoardColumn
              key={status}
              status={status as Issue["status"]}
              issues={items}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
