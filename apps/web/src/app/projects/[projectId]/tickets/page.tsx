'use client'

import { useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'
import { readItems, readItem } from '@directus/sdk'
import { Button } from '@repo/ui/components/shadcn/button'
import { DataTable } from '@repo/ui/components/atomics/organisms/DataTable'
import { DataTableProvider } from '@repo/ui/components/atomics/organisms/DataTable/DataTableContext'
import { DataTablePagination } from '@repo/ui/components/atomics/organisms/DataTable/DataTablePagination'
import { DataTableFilter } from '@repo/ui/components/atomics/organisms/DataTable/DataTableFilter'
import { TableCell, TableRow } from '@repo/ui/components/shadcn/table'
import { flexRender } from '@tanstack/react-table'
import { useColumns, type ColumnOptions } from './columns'
import CreateTicketDialog from '@/components/tickets/CreateTicketDialog'
import { ticketFilterConfig } from './filter-config'
import { FilterManagerState } from '@repo/ui/components/atomics/organisms/DataTable/filters/FilterManager'
import { useSession } from 'next-auth/react'

export default function TicketsPage() {
    const { data: project } = useProject() ?? {}
    const { data: session } = useSession() ?? {}
    const currentUser = session?.user
    const tableRef = useRef(null)
    const router = useRouter()
    const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)

    // Fetch tickets statuses
    const { data: ticketStatuses = [] } = useQuery({
        queryKey: ['ticket-statuses'],
        queryFn: async () => {
            try {
                return await directus.request(
                    readItems('tickets_statuses', {
                        fields: ['id', 'name', 'color', 'order'],
                        sort: ['order']
                    })
                );
            } catch (error) {
                console.error('Error fetching ticket statuses:', error);
                return [];
            }
        }
    });

    // Fetch ticket priorities
    const { data: ticketPriorities = [] } = useQuery({
        queryKey: ['ticket-priorities'],
        queryFn: async () => {
            try {
                return await directus.request(
                    readItems('tickets_priorities', {
                        fields: ['id', 'name', 'color', 'level'],
                        sort: ['level']
                    })
                );
            } catch (error) {
                console.error('Error fetching ticket priorities:', error);
                return [];
            }
        }
    });

    // Fetch ticket types
    const { data: ticketTypes = [] } = useQuery({
        queryKey: ['ticket-types'],
        queryFn: async () => {
            try {
                return await directus.request(
                    readItems('tickets_types', {
                        fields: ['id', 'name', 'icon', 'level', 'description'],
                        sort: ['level']
                    })
                );
            } catch (error) {
                console.error('Error fetching ticket types:', error);
                return [];
            }
        }
    });

    // Fetch sprints for the current project
    const { data: sprints = [] } = useQuery({
        queryKey: ['projects', project?.id, 'sprints'],
        queryFn: async () => {
            if (!project?.id) return []
            try {
                const sprintsData = await directus.request(
                    readItems('sprints', {
                        fields: ['id', 'name', 'start_date', 'end_date'],
                        filter: { project: { _eq: project.id } },
                        sort: ['-start_date']
                    })
                );
                return sprintsData.map(sprint => ({
                    value: sprint.id,
                    label: sprint.name
                }));
            } catch (error) {
                console.error('Error fetching sprints:', error);
                return [];
            }
        },
        enabled: !!project?.id
    })

    // Fetch epics for the current project
    const { data: epics = [] } = useQuery({
        queryKey: ['projects', project?.id, 'epics'],
        queryFn: async () => {
            if (!project?.id) return []
            try {
                const epicsData = await directus.request(
                    readItems('tickets', {
                        fields: ['id', 'title', 'key'],
                        filter: {
                            _and: [
                                { project: { _eq: project.id } },
                                { type: { _eq: 'epic' } }
                            ]
                        }
                    })
                );
                return epicsData.map(epic => ({
                    value: epic.id,
                    label: epic.key ? `${epic.key} - ${epic.title}` : epic.title
                }));
            } catch (error) {
                console.error('Error fetching epics:', error);
                return [];
            }
        },
        enabled: !!project?.id
    })

    // Fetch labels for the current project
    const { data: labels = [] } = useQuery({
        queryKey: ['projects', project?.id, 'labels'],
        queryFn: async () => {
            if (!project?.id) return []
            try {
                const labelsData = await directus.request(
                    readItems('labels', {
                        fields: ['id', 'name', 'color'],
                        filter: { project: { _eq: project.id } }
                    })
                );
                return labelsData.map(label => ({
                    value: label.id,
                    label: label.name
                }));
            } catch (error) {
                console.error('Error fetching labels:', error);
                return [];
            }
        },
        enabled: !!project?.id
    })

    // Create a memoized version of the filter config with all dynamic data
    const enhancedFilterConfig = useMemo(() => {
        if (!currentUser || !project) return ticketFilterConfig

        // Find the filter definitions that need dynamic options
        const updatedFilters = ticketFilterConfig.filters.map(filter => {
            switch (filter.id) {
                case 'sprint':
                    return { ...filter, options: sprints }
                case 'epic':
                    return { ...filter, options: epics }
                case 'labels':
                    return { ...filter, options: labels }
                default:
                    return filter
            }
        })

        return {
            ...ticketFilterConfig,
            filters: updatedFilters,
            context: {
                ...ticketFilterConfig.context,
                currentUserId: currentUser.id,
                currentProjectId: project.id,
                dateFormat: 'dd MMM yyyy'
            }
        }
    }, [currentUser, project, sprints, epics, labels])

    // Get initial filter state from URL parameters
    const getInitialFilterState = () => {
        if (typeof window === 'undefined') return undefined

        const params = new URLSearchParams(window.location.search)
        const filters = []
        const seenFilters = new Set()

        // Extract basic filters
        for (const [key, value] of params.entries()) {
            if (key.startsWith('filter.')) {
                const [, filterId] = key.split('.')
                if (!filterId || seenFilters.has(filterId)) continue

                seenFilters.add(filterId)
                const operator =
                    params.get(`filter.${filterId}.operator`) || 'contains'

                filters.push({
                    id: filterId,
                    value,
                    operator,
                })
            }
        }

        // Extract advanced filter
        const advancedFilter = params.get('advancedFilter')

        return {
            filters,
            advancedFilter: advancedFilter ? JSON.parse(advancedFilter) : null,
        }
    }

    // Prepare column options for the table
    const columnOptions: ColumnOptions = {
        colors: ticketStatuses || [],
        priorities: ticketPriorities || [],
        types: ticketTypes || []
    };

    // Use columns from the columns.tsx file with column options
    const columns = useColumns(columnOptions)

    // Fetch tickets with all the relevant relationships
    const { data: tickets = [], isFetched } = useQuery({
        queryKey: ['projects', project?.id, 'tickets-enhanced'],
        queryFn: async () => {
            if (!project?.id) return []

            try {
                return directus.Tickets.query({
                        fields: [
                            'id',
                            'title',
                            'description',
                            // 'due_date',
                            // 'story_points',
                            // 'estimated_time',
                            // 'spent_time',
                            // 'labels',
                            'date_created',
                            'date_updated',
                            'count(comments)',
                            'count(childs)',
                            {
                                status: [
                                    'id',
                                    'name',
                                    'color'
                                ],
                                priority: [
                                    'id',
                                    'name',
                                    'color',
                                    'level'
                                ],
                                type: [
                                    'id',
                                    'name',
                                    'icon'
                                ],
                                user_created: [
                                    'id',
                                    'first_name',
                                    'last_name',
                                    'avatar'
                                ],
                                assignee: [
                                    'id',
                                    'first_name',
                                    'last_name',
                                    'avatar'
                                ],
                                reporter: [
                                    'id',
                                    'first_name',
                                    'last_name',
                                    'avatar'
                                ],
                                sprint: [
                                    'id',
                                    'name',
                                    'start_date',
                                    'end_date'
                                ],
                                epic: [
                                    'id',
                                    'title',
                                    'key'
                                ],
                                parent: [
                                    'id',
                                    'title',
                                    'key',
                                    {
                                        type: [
                                            'id',
                                            'name',
                                            'icon'
                                        ]
                                    }
                                ],
                                childs: [
                                    'id',
                                    'title',
                                    {
                                        type: [
                                            'id',
                                            'name',
                                            'icon'
                                        ]
                                    }
                                ]
                            }
                        ],
                        filter: {
                            project: { _eq: project.id }
                        },
                        limit: 100,
                        sort: ['-date_updated']
                    }
                );
            } catch (error) {
                console.error('Error fetching tickets:', error)
                return []
            }
        },
        enabled: !!project?.id,
    })

    const handleFilterChange = (filterState: FilterManagerState) => {
        const params = new URLSearchParams(window.location.search)

        // Clear current filters from URL
        Array.from(params.keys())
            .filter(key => key.startsWith('filter.') || key === 'advancedFilter')
            .forEach(key => params.delete(key))

        // Add basic filters to URL
        if (!filterState.advancedFilter) {
            filterState.filters.forEach(filter => {
                if (filter.value && filter.value !== '__all__') {
                    params.set(`filter.${filter.id}`, String(filter.value))
                    params.set(`filter.${filter.id}.operator`, filter.operator)
                }
            })
        }

        // Add advanced filter to URL if present
        if (filterState.advancedFilter) {
            params.set(
                'advancedFilter',
                JSON.stringify(filterState.advancedFilter)
            )
        } else {
            params.delete('advancedFilter')
        }

        // Update URL without reloading
        window.history.replaceState(
            {},
            '',
            `${window.location.pathname}?${params.toString()}`
        )
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex-none p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Tickets
                    </h2>
                    <Button onClick={() => setIsCreateTicketOpen(true)} disabled={!project}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Ticket
                    </Button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-8 pt-0">
                <DataTableProvider
                    columns={columns}
                    data={tickets ?? []}
                    tableRef={tableRef}
                    initialState={{
                        columnVisibility: {
                            id: false,
                            reporter: false,
                            date_created: false,
                            due_date: false
                        }
                    }}
                >
                    <DataTableFilter
                        config={enhancedFilterConfig}
                        initialState={getInitialFilterState()}
                        onFilterChange={handleFilterChange}
                    />

                    <DataTable
                        isLoading={!isFetched}
                        notFound="No tickets found"
                        row={(row) => (
                            <TableRow
                                key={row.id}
                                className="cursor-pointer"
                                onClick={() => {
                                    if (!project) return
                                    router.push(
                                        `/projects/${project.id}/tickets/${row.getValue('id')}`
                                    )
                                }}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        )}
                    />
                    <DataTablePagination />
                </DataTableProvider>
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
