"use client"

import { Button } from '@repo/ui/components/shadcn/button'
import { BoardHeaders } from '@/components/molecules/BoardHeaders'
import { BoardColumn } from '@/components/molecules/BoardColumn'
import { Plus } from 'lucide-react'
import { DndContext, DragEndEvent } from "@dnd-kit/core"
import { useState } from "react"
import { Issue } from "@/types/issue"

const mockIssues = [
  { id: '1', title: 'Fix login bug', priority: 'high', status: 'todo' },
  { id: '2', title: 'Update documentation', priority: 'low', status: 'in-progress' },
  { id: '3', title: 'Add new feature', priority: 'medium', status: 'done' },
] as const

export default function BoardPage() {
  const [issues, setIssues] = useState<Issue[]>(mockIssues)

  function handleDragEnd(event: DragEndEvent) {
    // ...existing code...
  }

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="rounded-md border p-4">
        <BoardHeaders />
        <DndContext onDragEnd={handleDragEnd}>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <BoardColumn 
              id="todo"
              title="To Do" 
              issues={issues.filter(i => i.status === 'todo')} 
            />
            <BoardColumn 
              id="in-progress"
              title="In Progress" 
              issues={issues.filter(i => i.status === 'in-progress')} 
            />
            <BoardColumn 
              id="done"
              title="Done" 
              issues={issues.filter(i => i.status === 'done')} 
            />
          </div>
        </DndContext>
      </div>
    </div>
  )
}
