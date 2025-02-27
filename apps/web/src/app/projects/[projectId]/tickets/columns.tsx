import { cn, formatDate } from '@/lib/utils'
import { Collections } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/utils'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { ColumnDef } from '@tanstack/react-table'

export type DType = ApplyFields<
    Collections.Tickets,
    [
        'id',
        'title',
        'status',
        'priority',
        'description',
        'date_created',
        'date_updated',
        {
            user_created: ['first_name', 'last_name']
        },
        {
            assignee: ['first_name', 'last_name']
        },
    ]
>

export type ColumnOptions = {
    colors: ApplyFields<Collections.TicketsStatus, ['id', 'color']>[]
    priorities: ApplyFields<Collections.TicketsPriorities, ['id', 'color']>[]
}

export const useColumns = (options: ColumnOptions) =>
    [
        {
            accessorKey: 'title',
            header: 'Title',
            size: 250,
            filterFn: 'includesString',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            size: 120,
            filterFn: 'equals',
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge
                        variant="secondary"
                        style={{
                            backgroundColor: options.colors.find(
                                (color) => color.id === status
                            )?.color,
                        }}
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            size: 120,
            filterFn: 'equals',
            cell: ({ row }) => {
                const priority = row.original.priority
                return (
                    <div className="flex items-center gap-2">
                        <div
                            className={cn('h-2 w-2 rounded-full')}
                            style={{
                                backgroundColor: options.priorities.find(
                                    (color) => color.id === priority
                                )?.color,
                            }}
                        />
                        <span>{priority}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'assignee',
            header: 'Assignee',
            size: 150,
            cell: ({ row }) => {
                const assignee = row.original.assignee
                return assignee
                    ? `${assignee.first_name} ${assignee.last_name}`
                    : 'Unassigned'
            },
        },
        {
            accessorKey: 'date_updated',
            header: 'Updated',
            size: 150,
            cell: ({ row }) => {
                const date = row.original.date_updated
                return date ? formatDate(date) : 'Never'
            },
        },
    ] satisfies ColumnDef<DType>[]
