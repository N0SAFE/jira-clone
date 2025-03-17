'use client'
import { useRef, useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus, AlertCircle } from 'lucide-react'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'
import { readItems } from '@directus/sdk'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@repo/ui/components/shadcn/card'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { DataTable } from '@repo/ui/components/atomics/organisms/DataTable'
import { DataTableProvider } from '@repo/ui/components/atomics/organisms/DataTable/DataTableContext'
import { DataTablePagination } from '@repo/ui/components/atomics/organisms/DataTable/DataTablePagination'
import { TableCell, TableRow } from '@repo/ui/components/shadcn/table'
import { flexRender, getCoreRowModel } from '@tanstack/react-table'
import { useColumns, type ColumnOptions } from './columns'
import CreateTicketDialog from '@/components/tickets/CreateTicketDialog'
import { useFilterInstance } from './filter-config'
import { useSession } from 'next-auth/react'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'
import {
    Alert,
    AlertTitle,
    AlertDescription,
} from '@repo/ui/components/shadcn/alert'
import { parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { ProjectsProjectIdTicketsTicketId } from '@/routes'
import { ExtendedSortingState, Filter } from '@repo/ui/types/data-table'
import { directusFilterAdapter } from '@repo/ui/config/filters/adapter/directus.adapter'
import { useReactTable } from '@tanstack/react-table'
import { DataTableFloatingBar } from '../../../../../../../packages/ui/components/atomics/organisms/DataTable/DataTableFloatingBar'
import { DataTableAdvancedToolbar } from '../../../../../../../packages/ui/components/atomics/organisms/DataTable/DataTableAdvancedToolbar'

const filtersSchema = z.array(
    z.object({
        id: z.string(),
        value: z.string(),
        operator: z.string(),
    })
)

export default function TicketsPage() {
    const { data: project } = useProject() ?? {}
    const { data: session } = useSession() ?? {}
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

    // Fetch tickets statuses
    const {
        data: ticketStatuses = [],
        isLoading: isLoadingStatuses,
        error: statusesError,
    } = useQuery({
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
    })

    // Fetch ticket priorities
    const {
        data: ticketPriorities = [],
        isLoading: isLoadingPriorities,
        error: prioritiesError,
    } = useQuery({
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
                console.error('Error fetching ticket priorities:', error)
                throw error
            }
        },
    })

    // Fetch ticket types
    const {
        data: ticketTypes = [],
        isLoading: isLoadingTypes,
        error: typesError,
    } = useQuery({
        queryKey: ['ticket-types'],
        queryFn: async () => {
            try {
                return await directus.TicketsTypes.query({
                    fields: ['id', 'name', 'icon', 'level', 'description'],
                    sort: ['level'],
                })
            } catch (error) {
                console.error('Error fetching ticket types:', error)
                throw error
            }
        },
    })

    // Transform filters to proper column filters for the table
    const columnFilters = useMemo(() => {
        return filters.map((filter) => ({
            id: filter.id,
            value: filter,
        }))
    }, [filters])

    // // Get initial filter state from URL parameters
    // const getInitialFilterState = () => {
    //     if (typeof window === 'undefined') return undefined
    //     const params = new URLSearchParams(window.location.search)
    //     const filters = []
    //     const seenFilters = new Set()
    //     // Extract basic filters
    //     for (const [key, value] of params.entries()) {
    //         if (key.startsWith('filter.')) {
    //             const [, filterId] = key.split('.')
    //             if (!filterId || seenFilters.has(filterId)) continue
    //             seenFilters.add(filterId)
    //             const operator =
    //                 params.get(`filter.${filterId}.operator`) || 'contains'
    //             filters.push({
    //                 id: filterId,
    //                 value,
    //                 operator,
    //             })
    //         }
    //     }
    //     // Extract advanced filter
    //     const advancedFilter = params.get('advancedFilter')
    //     return {
    //         filters,
    //         advancedFilter: advancedFilter ? JSON.parse(advancedFilter) : null,
    //     }
    // }

    // Prepare column options for the table
    const columnOptions: ColumnOptions = {
        colors: ticketStatuses || [],
        priorities: ticketPriorities || [],
        types: ticketTypes || [],
    }

    // Use columns from the columns.tsx file with column options
    const columns = useColumns(columnOptions)

    // Fetch tickets with all the relevant relationships
    const {
        data: tickets = [],
        isFetched,
        isLoading: isLoadingTickets,
        error: ticketsError,
    } = useQuery({
        queryKey: ['projects', project?.id, 'tickets-enhanced'],
        queryFn: async () => {
            if (!project?.id) return []
            try {
                return directus.Tickets.query({
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
                    limit: 100,
                    sort: ['-date_updated'],
                })
            } catch (error) {
                console.error('Error fetching tickets:', error)
                throw error
            }
        },
        enabled: !!project?.id,
    })

    // Check for any errors
    const hasError =
        statusesError || prioritiesError || typesError || ticketsError

    // const handleFilterChange = (filterState: FilterManagerState) => {
    //     const params = new URLSearchParams(window.location.search)
    //     // Clear current filters from URL
    //     Array.from(params.keys())
    //         .filter(
    //             (key) => key.startsWith('filter.') || key === 'advancedFilter'
    //         )
    //         .forEach((key) => params.delete(key))
    //     // Add basic filters to URL
    //     if (!filterState.advancedFilter) {
    //         filterState.filters.forEach((filter) => {
    //             if (filter.value && filter.value !== '__all__') {
    //                 params.set(`filter.${filter.id}`, String(filter.value))
    //                 params.set(`filter.${filter.id}.operator`, filter.operator)
    //             }
    //         })
    //     }
    //     // Add advanced filter to URL if present
    //     if (filterState.advancedFilter) {
    //         params.set(
    //             'advancedFilter',
    //             JSON.stringify(filterState.advancedFilter)
    //         )
    //     } else {
    //         params.delete('advancedFilter')
    //     }
    //     // Update URL without reloading
    //     window.history.replaceState(
    //         {},
    //         '',
    //         `${window.location.pathname}?${params.toString()}`
    //     )
    // }

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
        // pageCount,
        initialState: {
            columnPinning: { right: ['actions'] },
        },
        state: {
            sorting,
            globalFilter: {
                joinOperator: operator,
                filters: filters,
            },
            columnFilters,
        },
        getRowId: (originalRow) => String(originalRow.id),
        // onSortingChange: (updater) => {
        //     if (typeof updater === 'function') {
        //         const newSortingState = updater(sorting)
        //         setSorting(newSortingState as ExtendedSortingState<Task>)
        //     } else {
        //         setSorting(updater as ExtendedSortingState<Task>)
        //     }
        // },
    })

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
                {isLoading ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-[200px]" />
                                <Skeleton className="h-8 w-[120px]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <Skeleton className="h-8 w-[60px]" />
                                        <Skeleton className="h-8 w-[100px]" />
                                        <Skeleton className="h-8 w-[250px]" />
                                        <Skeleton className="h-8 w-[80px]" />
                                        <Skeleton className="h-8 w-[80px]" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <DataTable table={table}>
                            <DataTableAdvancedToolbar
                                table={table}
                                shallow={false}
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
                        </DataTable>
                        <div className="flex flex-col gap-2.5">
                            <DataTablePagination table={table} />
                            <DataTableFloatingBar
                                table={table}
                                // actionGenerator={generateActions}
                                // helpers={{ tag, setTag }}
                            />
                        </div>
                    </>
                    // <DataTableProvider
                    //     columns={columns}
                    //     data={tickets ?? []}
                    //     tableRef={tableRef}
                    //     initialState={{
                    //         columnVisibility: {
                    //             id: false,
                    //             reporter: false,
                    //             date_created: false,
                    //             due_date: false,
                    //             epic: false,
                    //             sprint: false,
                    //             labels: false,
                    //             story_points: false,
                    //         },
                    //     }}
                    // >
                    //     <DataTableFilter
                    //         config={enhancedFilterConfig}
                    //         initialState={filters}
                    //         onFilterChange={setFilters}
                    //     />
                    //     <DataTable
                    //         className="h-full py-4"
                    //         // divClassname='overflow-auto'
                    //         divClassname="*:h-full"
                    //         isLoading={!isFetched}
                    //         notFound={
                    //             <div className="py-10 text-center">
                    //                 <h3 className="text-lg font-medium">
                    //                     No tickets found
                    //                 </h3>
                    //                 <p className="text-muted-foreground mt-2">
                    //                     Get started by creating a new ticket for
                    //                     this project.
                    //                 </p>
                    //                 <Button
                    //                     variant="outline"
                    //                     className="mt-4"
                    //                     onClick={() =>
                    //                         setIsCreateTicketOpen(true)
                    //                     }
                    //                     disabled={!project}
                    //                 >
                    //                     <Plus className="mr-2 h-4 w-4" />
                    //                     Create Ticket
                    //                 </Button>
                    //             </div>
                    //         }
                    //         row={(row) => (
                    //             <TableRow
                    //                 key={row.id}
                    //                 className="hover:bg-muted/50 cursor-pointer"
                    //                 onClick={() => {
                    //                     if (!project) return
                    //                     ProjectsProjectIdTicketsTicketId.immediate(
                    //                         router,
                    //                         {
                    //                             projectId: project.id,
                    //                             ticketId: row.getValue('id'),
                    //                         }
                    //                     )
                    //                 }}
                    //             >
                    //                 {row.getVisibleCells().map((cell) => (
                    //                     <TableCell key={cell.id}>
                    //                         {flexRender(
                    //                             cell.column.columnDef.cell,
                    //                             cell.getContext()
                    //                         )}
                    //                     </TableCell>
                    //                 ))}
                    //             </TableRow>
                    //         )}
                    //     />
                    //     <DataTablePagination />
                    // </DataTableProvider>
                )}
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
