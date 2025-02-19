'use client'

import { Button } from '@repo/ui/components/shadcn/button'
import { BoardHeaders } from '@/components/molecules/BoardHeaders'
import { BoardColumn } from '@/components/molecules/BoardColumn'
import { Plus } from 'lucide-react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useOptimistic, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import directus from '@/lib/directus'

export default function BoardPage() {
    const { projectId } = useParams<{ projectId: string }>()

    const { data: tickets } = useQuery({
        queryKey: ['projects', projectId, 'tickets'],
        queryFn: async () => {
            return directus.Tickets.query({
                filter: {
                    project: projectId,
                },
            })
        },
    })
    const [optimiticTickets, setOptimiticTickets] = useOptimistic(tickets)

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over) {
            return
        }

        const activeId = active.id
        const overId = over.id

        const newTickets = optimiticTickets?.map((issue) => {
            if (issue.id === activeId) {
                return { ...issue, status: overId }
            }

            return issue
        })

        setOptimiticTickets(newTickets)
    }

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="rounded-md border p-4">
                <DndContext onDragEnd={handleDragEnd}>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <BoardColumn
                            id="todo"
                            title="To Do"
                            tickets={
                                tickets?.filter((i) => i.status === 'todo') ||
                                []
                            }
                        />
                        <BoardColumn
                            id="in-progress"
                            title="In Progress"
                            tickets={
                                tickets?.filter(
                                    (i) => i.status === 'in-progress'
                                ) || []
                            }
                        />
                        <BoardColumn
                            id="done"
                            title="Done"
                            tickets={
                                tickets?.filter((i) => i.status === 'done') ||
                                []
                            }
                        />
                    </div>
                </DndContext>
            </div>
        </div>
    )
}
