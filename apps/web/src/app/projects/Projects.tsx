'use client'

import { Loader2, Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { BoardHeader } from '@/components/organisms/BoardHeader'
import { ProjectsProjectId } from '@/routes'
import { NewProject } from '@/components/organisms/NewProject'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/ui/components/shadcn/dialog'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { DType, useColumns } from './columns'
import useTableRef from '@repo/ui/hooks/useTableRef'
import { DataTablePagination } from '@repo/ui/components/atomics/organisms/DataTable/DataTablePagination'
import { DataTableProvider } from '@repo/ui/components/atomics/organisms/DataTable/DataTableContext'
import { DataTable } from '@repo/ui/components/atomics/organisms/DataTable'
import { TableCell, TableRow } from '@repo/ui/components/shadcn/table'
import {
    flexRender,
    getCoreRowModel,
    Row,
    useReactTable,
} from '@tanstack/react-table'
import directus from '@/lib/directus'
import { ApplyFields } from '@repo/directus-sdk/utils'
import { Collections } from '@repo/directus-sdk/client'
import { useRouter } from 'next/navigation'
import { DataTableAdvancedToolbar } from '@repo/ui/components/atomics/organisms/DataTable/DataTableAdvancedToolbar'
import { ExtendedSortingState, Filter } from '@repo/ui/types/data-table'
import { directusFilterAdapter } from '@repo/ui/config/filters/adapter/directus.adapter'
import { useFilterInstance } from './filter-config'
import { DataTableFloatingBar } from '@repo/ui/components/atomics/organisms/DataTable/DataTableFloatingBar'
import useElementInputDetector from '@/hooks/useElementInputDetector'
import { cn } from '@/lib/utils'

export function Projects() {
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data: session } = useSession()

    const [filters, setFilters] = useState<
        Filter<typeof directusFilterAdapter>[]
    >([])
    const [operator, setOperator] = useState<'and' | 'or'>('and')
    // State for sorting
    const [sorting, setSorting] = useState<
        ExtendedSortingState<Record<string, string>>
    >([{ id: 'createdAt', desc: true }])
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })

    const {
        data: { projects = [], projectsCount = 0 } = {
            projects: [],
            projectsCount: 0,
        },
        isFetched,
        isPlaceholderData,
        isLoading: isLoadingProjects,
    } = useQuery({
        queryKey: ['projects', session?.user.id],
        queryFn: () =>
            Promise.all([
                directus.Projects.query({
                    filter: {
                        user_created: {
                            _contains: session?.user.id,
                        },
                    },
                    fields: [
                        'id',
                        'name',
                        {
                            owner: ['id', 'avatar', 'first_name', 'last_name'],
                        },
                    ],
                }),
                directus.Projects.aggregate({
                    aggregate: {
                        count: ['id'],
                    },
                    query: {
                        filter: {
                            user_created: {
                                _contains: session?.user.id,
                            },
                        },
                    },
                }),
            ]).then(([projects, { count }]) => ({
                projects,
                projectsCount: Number(count.id),
            })),
    })

    const projectMutation = useMutation({
        mutationFn: (
            newProject: Pick<
                ApplyFields<Collections.Projects>,
                'name' | 'description'
            >
        ) =>
            directus.Project.create({
                ...newProject,
                owner: session?.user.id,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return query.queryKey[0] === 'projects'
                },
            })
            setIsDialogOpen(false)
        },
    })

    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const columns = useColumns({
        accessToken: session?.access_token,
    })

    // Transform filters to proper column filters for the table
    const columnFilters = useMemo(() => {
        return filters.map((filter) => ({
            id: filter.id,
            value: filter,
        }))
    }, [filters])

    const filtersInstance = useFilterInstance(
        {
            filters,
            joinOperator: operator,
        },
        {},
        (filters, joinOperator) => {
            setFilters(filters)
            setOperator(joinOperator)
        }
    )

    const table = useReactTable({
        data: projects ?? [],
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
        rowCount: projectsCount,
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
    const handleRowClick = useCallback(
        (rowId: Collections.Projects['id']) => {
            ProjectsProjectId.immediate(router, {
                projectId: rowId,
            })
        },
        [router]
    )

    // Add state for tracking last selected row
    const lastSelectedRef = useRef<string | null>(null)

    const renderTableRow = useCallback(
        (row: Row<(typeof projects)[number]>, children: React.ReactNode) => {
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
                    },
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

    const isLoading = isLoadingProjects

    return (
        <div className="space-y-4 p-8 pt-6">
            <BoardHeader title="Projects" projectId={''}>
                <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit profile</DialogTitle>
                            <DialogDescription>
                                Make changes to your profile here. Click save
                                when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <NewProject
                                onSubmit={projectMutation.mutate}
                                isPending={projectMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </BoardHeader>

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
                                    Loading projects...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <DataTablePagination table={table} />
            </div>

            {/* <DataTableProvider
                columns={columns}
                data={projects ?? []}
                tableRef={tableRef}
                // tableOptions={{ // @flag server-side-pagination
                //     manualPagination: true,
                //     rowCount: context?.paginator?.total,
                //     state: {
                //         pagination: pagination,
                //     },
                //     onPaginationChange: async (udpater) => {
                //         setPagination((last) =>
                //             functionalUpdate(udpater, last)
                //         )
                //     },
                // }}
            >
                <DataTable<DType>
                    isLoading={!isFetched && !isPlaceholderData}
                    isLoadingMore={isPlaceholderData}
                    notFound="no spas found"
                    row={(row) => (
                        <TableRow
                            className="hover:bg-accent/50 hover:cursor-pointer"
                            data-state={row.getIsSelected() && 'selected'}
                            onClick={() => {
                                const rowId = row.original.id
                                if (rowId) {
                                    ProjectsProjectId.immediate(router, {
                                        projectId: rowId,
                                    })
                                }
                            }}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    style={{ width: cell.column.getSize() }}
                                >
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
            </DataTableProvider> */}
        </div>
    )
}
