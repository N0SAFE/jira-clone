'use client'
import {
    useState,
    useMemo,
    useTransition,
    useRef,
    useCallback,
    useEffect,
} from 'react'
import { useRouter } from 'next/navigation'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertCircle, Loader2 } from 'lucide-react'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'
import { readItems } from '@directus/sdk'
import { Button } from '@repo/ui/components/shadcn/button'
import { DataTable } from '@repo/ui/components/atomics/organisms/DataTable'
import { DataTablePagination } from '@repo/ui/components/atomics/organisms/DataTable/DataTablePagination'
import { TableRow } from '@repo/ui/components/shadcn/table'
import { getCoreRowModel, Row } from '@tanstack/react-table'
import { useColumns, type ColumnOptions } from './columns'
import CreateTicketDialog from '@/components/tickets/CreateTicketDialog'
import { useFilterInstance } from './filter-config'
import { useSession } from 'next-auth/react'
import { Badge } from '@repo/ui/components/shadcn/badge'
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from '@repo/ui/components/shadcn/alert'
import { ProjectsProjectIdTicketsTicketId } from '@/routes'
import { ExtendedSortingState, Filter } from '@repo/ui/types/data-table'
import { directusFilterAdapter } from '@repo/ui/config/filters/adapter/directus.adapter'
import { useReactTable } from '@tanstack/react-table'
import { DataTableFloatingBar } from '@repo/ui/components/atomics/organisms/DataTable/DataTableFloatingBar'
import { DataTableAdvancedToolbar } from '@repo/ui/components/atomics/organisms/DataTable/DataTableAdvancedToolbar'
import useElementInputDetector from '@/hooks/useElementInputDetector'
import { Collections } from '@repo/directus-sdk/client'
import { cn } from '@/lib/utils'

export default function TicketsPage() {
    const { data: project } = useProject() ?? {}
    const { data: session } = useSession() ?? {}
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
    const [filters, setFilters] = useState<
        Filter<typeof directusFilterAdapter>[]
    >([])
    const [operator, setOperator] = useState<'and' | 'or'>('and')
    // State for sorting
    const [sorting, setSorting] = useState<
        ExtendedSortingState<Record<string, string>>
    >([{ id: 'createdAt', desc: true }])
    // State for pending actions
    const [isPending, startTransition] = useTransition()
    const [currentAction, setCurrentAction] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [
        {
            data: ticketStatuses = [],
            isLoading: isLoadingStatuses,
            error: statusesError,
        },
        {
            data: ticketPriorities = [],
            isLoading: isLoadingPriorities,
            error: prioritiesError,
        },
        {
            data: ticketTypes = [],
            isLoading: isLoadingTypes,
            error: typesError,
        },
    ] = useQueries({
        queries: [
            {
                queryKey: ['ticket-statuses'],
                queryFn: async () => {
                    try {
                        return await directus.request(
                            readItems('tickets_statuses', {
                                fields: ['id', 'name', 'color', 'order'],
                                sort: ['order'],
                            })
                        )
                    } catch (error) {
                        console.error('Error fetching ticket statuses:', error)
                        throw error
                    }
                },
            },
            {
                queryKey: ['ticket-priorities'],
                queryFn: async () => {
                    try {
                        return await directus.request(
                            readItems('tickets_priorities', {
                                fields: ['id', 'name', 'color', 'level'],
                                sort: ['level'],
                            })
                        )
                    } catch (error) {
                        console.error(
                            'Error fetching ticket priorities:',
                            error
                        )
                        throw error
                    }
                },
            },
            {
                queryKey: ['ticket-types'],
                queryFn: async () => {
                    try {
                        return await directus.TicketsTypes.query({
                            fields: [
                                'id',
                                'name',
                                'icon',
                                'level',
                                'description',
                            ],
                            sort: ['level'],
                        })
                    } catch (error) {
                        console.error('Error fetching ticket types:', error)
                        throw error
                    }
                },
            },
        ],
    })

    // Fetch tickets with all the relevant relationships
    const {
        data: { tickets = [], ticketsCount } = { tickets: [], ticketsCount: 0 },
        isFetched,
        isLoading: isLoadingTickets,
        error: ticketsError,
    } = useQuery({
        queryKey: [
            'projects',
            project?.id,
            'tickets-enhanced',
            {
                pagination,
            },
        ],
        queryFn: async () => {
            if (!project?.id) return { tickets: [], ticketsCount: 0 }
            try {
                return Promise.all([
                    directus.Tickets.query({
                        fields: [
                            'id',
                            'title',
                            'description',
                            'date_created',
                            'date_updated',
                            'count(comments)',
                            'count(childs)',
                            {
                                status: ['id', 'name', 'color'],
                                priority: ['id', 'name', 'color', 'level'],
                                type: ['id', 'name', 'icon'],
                                user_created: [
                                    'id',
                                    'first_name',
                                    'last_name',
                                    'avatar',
                                ],
                                assignee: [
                                    'id',
                                    'first_name',
                                    'last_name',
                                    'avatar',
                                ],
                                parent: [
                                    'id',
                                    'title',
                                    {
                                        type: ['id', 'name', 'icon'],
                                    },
                                ],
                                childs: [
                                    'id',
                                    'title',
                                    {
                                        type: ['id', 'name', 'icon'],
                                    },
                                ],
                            },
                        ],
                        filter: {
                            project: { _eq: project.id },
                        },
                        sort: ['-date_updated'],
                        page: pagination.pageIndex + 1,
                        limit: pagination.pageSize,
                    }),
                    directus.Tickets.aggregate({
                        aggregate: {
                            count: ['id'],
                        },
                        query: {
                            filter: {
                                project: { _eq: project.id },
                            },
                        },
                    }),
                ]).then(([res, agg]) => {
                    return {
                        tickets: res,
                        ticketsCount: Number(agg.count.id),
                    }
                })
            } catch (error) {
                console.error('Error fetching tickets:', error)
                throw error
            }
        },
        enabled: !!project?.id,
    })

    // Transform filters to proper column filters for the table
    const columnFilters = useMemo(() => {
        return filters.map((filter) => ({
            id: filter.id,
            value: filter,
        }))
    }, [filters])

    // Prepare column options for the table
    const columnOptions: ColumnOptions = {
        colors: ticketStatuses || [],
        priorities: ticketPriorities || [],
        types: ticketTypes || [],
    }

    // Use columns from the columns.tsx file with column options
    const columns = useColumns(columnOptions)

    // Check for any errors
    const hasError =
        statusesError || prioritiesError || typesError || ticketsError

    // Loading state
    const isLoading =
        isLoadingTickets ||
        isLoadingStatuses ||
        isLoadingPriorities ||
        isLoadingTypes

    const filtersInstance = useFilterInstance(
        {
            filters,
            joinOperator: operator,
        },
        {
            priorityOptions:
                ticketPriorities.map(({ id, name }) => ({
                    label: name,
                    value: id,
                })) || [],
            statusOptions:
                ticketStatuses.map(({ id, name }) => ({
                    label: name,
                    value: id,
                })) || [],
        },
        (filters, joinOperator) => {
            setFilters(filters)
            setOperator(joinOperator)
        }
    )

    const table = useReactTable({
        data: tickets ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        initialState: {
            columnPinning: { right: ['actions'] },
            sorting: sorting, // Make sure initial sorting state is set
        },
        state: {
            sorting,
            globalFilter: {
                joinOperator: operator,
                filters: filters,
            },
            columnFilters,
            pagination,
        },
        manualPagination: true,
        manualSorting: true, // Add this to indicate manual sorting
        rowCount: ticketsCount,
        getRowId: (originalRow) => String(originalRow.id),
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newPaginationState = updater(pagination)
                setPagination(newPaginationState)
            } else {
                setPagination(updater)
            }
        },
        onSortingChange: (updater) => {
            if (typeof updater === 'function') {
                const newSortingState = updater(sorting)
                setSorting(newSortingState)
                // Trigger refetch when sorting changes
                table.resetPageIndex()
            } else {
                setSorting(updater)
                // Trigger refetch when sorting changes
                table.resetPageIndex()
            }
        },
    })

    // Add this effect to refetch data when sorting changes
    useEffect(() => {
        if (project?.id) {
            // Invalidate the query to trigger a refetch
            queryClient.invalidateQueries({
                queryKey: ['projects', project.id, 'tickets-enhanced'],
            })
        }
    }, [sorting, project?.id])

    console.log(tickets)
    console.log(sorting)

    const handleRowClick = useCallback(
        (rowId: Collections.Tickets['id']) => {
            if (!project) return
            ProjectsProjectIdTicketsTicketId.immediate(router, {
                projectId: project.id,
                ticketId: rowId,
            })
        },
        [project, router]
    )

    // Add state for tracking last selected row
    const lastSelectedRef = useRef<string | null>(null)

    const renderTableRow = useCallback(
        (row: Row<(typeof tickets)[number]>, children: React.ReactNode) => {
            const rowRef = useRef<HTMLTableRowElement>(null)

            useElementInputDetector(rowRef, {
                bindings: {
                    // Shift+click OR Ctrl+click for multi-select
                    '(click(left)+shift)|(click(left)+ctrl)': (e) => {
                        if (!lastSelectedRef.current) {
                            row.toggleSelected()
                            lastSelectedRef.current = row.id
                            return
                        }

                        if (e instanceof MouseEvent && e.shiftKey) {
                            // Get all visible rows
                            const rows = table.getRowModel().rows
                            const lastSelectedIdx = rows.findIndex(
                                (r) => r.id === lastSelectedRef.current
                            )
                            const currentIdx = rows.findIndex(
                                (r) => r.id === row.id
                            )

                            if (lastSelectedIdx === -1) return

                            // Select all rows between last selected and current
                            const start = Math.min(lastSelectedIdx, currentIdx)
                            const end = Math.max(lastSelectedIdx, currentIdx)

                            rows.slice(start, end + 1).forEach((r) =>
                                r.toggleSelected(true)
                            )
                        } else {
                            // Ctrl+click case
                            row.toggleSelected()
                            lastSelectedRef.current = row.id
                        }
                    },
                    'click(left)': () => {
                        // Clear other selections on normal click
                        table.toggleAllRowsSelected(false)
                        row.toggleSelected(true)
                        lastSelectedRef.current = row.id
                        handleRowClick(row.original.id)
                    },
                    // Right click to select without opening context menu
                    'click(right)': (e) => {
                        e.preventDefault()
                        if (!row.getIsSelected()) {
                            table.toggleAllRowsSelected(false)
                            row.toggleSelected(true)
                        }
                    }
                },
            })

            return (
                <TableRow
                    ref={rowRef}
                    data-row-id={row.id}
                    className={cn(
                        'hover:bg-muted/50 cursor-pointer',
                        row.getIsSelected() && 'bg-muted'
                    )}
                    tabIndex={0}
                >
                    {children}
                </TableRow>
            )
        },
        [handleRowClick, table]
    )

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-none p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Tickets
                        </h2>
                        {project && (
                            <p className="text-muted-foreground mt-1">
                                Manage tickets for project{' '}
                                <Badge variant="outline" className="ml-1">
                                    {project.key || project.name}
                                </Badge>
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={() => setIsCreateTicketOpen(true)}
                        disabled={!project}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Ticket
                    </Button>
                </div>
            </div>

            {hasError && (
                <div className="px-8 pb-4">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            There was an error loading ticket data. Please try
                            refreshing the page.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="flex h-full min-h-0 flex-1 flex-col p-8 pt-0">
                <DataTableAdvancedToolbar
                    table={table}
                    instance={filtersInstance}
                    onFiltersChange={(filters) => {
                        setFilters(filters)
                    }}
                    onJoinOperatorChange={(operator) => {
                        setOperator(operator)
                    }}
                    filters={filters}
                    joinOperator={operator}
                />

                <div className="relative flex-1">
                    <DataTable table={table} renderRow={renderTableRow}>
                        <DataTableFloatingBar
                            table={table}
                            // actionGenerator={generateActions}
                            // helpers={{ tag, setTag }}
                        />
                    </DataTable>
                    {isLoading && (
                        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                <span className="text-sm font-medium">
                                    Loading tickets...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <DataTablePagination table={table} />
            </div>

            {project && (
                <CreateTicketDialog
                    open={isCreateTicketOpen}
                    onOpenChange={setIsCreateTicketOpen}
                    project={project}
                />
            )}
        </div>
    )
}
