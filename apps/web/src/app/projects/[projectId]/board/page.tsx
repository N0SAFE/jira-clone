'use client'

import { BoardColumn } from '@/components/molecules/BoardColumn'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useOptimistic } from 'react'
import { useQuery } from '@tanstack/react-query'
import directus from '@/lib/directus'
import { useProject } from '@/context/ProjectContext'
import { Collections } from '@repo/directus-sdk/client'

type TicketStatus = 'todo' | 'in-progress' | 'done';

type BoardTicket = {
    id: number;
    status: TicketStatus;
    title: string;
    priority: Collections.Tickets['priority'];
    description?: string;
};

export default function BoardPage() {
    const { project } = useProject();

    const { data: tickets } = useQuery({
        queryKey: ['projects', project?.id, 'tickets'],
        queryFn: async () => {
            const result = await directus.Tickets.query({
                filter: {
                    project: project?.id,
                },
                fields: ['id', 'title', 'status', 'priority', 'description'],
            });
            return (result || []).map(ticket => ({
                ...ticket,
                status: mapStatusToBoard(ticket.status),
            })) as BoardTicket[];
        },
        enabled: !!project?.id,
    })

    const [optimiticTickets, setOptimiticTickets] = useOptimistic<BoardTicket[] | undefined>(tickets)

    // Map Directus status to board status
    function mapStatusToBoard(status: string): TicketStatus {
        switch (status) {
            case 'draft':
                return 'todo';
            case 'published':
                return 'in-progress';
            case 'archived':
                return 'done';
            default:
                return 'todo';
        }
    }

    // TODO: Will be used when implementing status update API
    function mapBoardToStatus(status: TicketStatus): string {
        switch (status) {
            case 'todo':
                return 'draft';
            case 'in-progress':
                return 'published';
            case 'done':
                return 'archived';
            default:
                return 'draft';
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || !optimiticTickets) {
            return
        }

        const activeId = active.id
        const overId = over.id as TicketStatus

        const newTickets = optimiticTickets.map((issue) => {
            if (issue.id === activeId) {
                return { 
                    ...issue, 
                    status: overId,
                }
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
