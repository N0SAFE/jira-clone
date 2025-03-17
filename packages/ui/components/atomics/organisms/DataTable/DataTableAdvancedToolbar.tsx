'use client'

import * as React from 'react'
import { type Table } from '@tanstack/react-table'
import { cn } from '@repo/ui/lib/utils'
import { DataTableSortList } from '@repo/ui/components/atomics/organisms/DataTable/filters/DataTableSortList'
import { DataTableViewOptions } from '@repo/ui/components/atomics/organisms/DataTable/DataTableViewOptions'
import { DataTableFilter } from './filters/DataTableFilter'
import {
    Filter,
    FilterAdapter,
    FiltersInstance,
} from '@repo/ui/types/data-table'
import { DataTableSaveViews } from '@repo/ui/components/atomics/organisms/DataTable/filters/DataTableSaveViews'
import { SavedView } from '@repo/ui/hooks/use-saved-views'
import { X } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'

interface DataTableAdvancedToolbarProps<TData, TAdapter extends FilterAdapter>
    extends React.HTMLAttributes<HTMLDivElement> {
    table: Table<TData>
    debounceMs?: number
    shallow?: boolean
    instance: FiltersInstance<TAdapter>
    onFiltersChange?: (filters: Filter<TAdapter>[]) => void
    onJoinOperatorChange?: (operator: 'and' | 'or') => void
    filters?: Filter<TAdapter>[]
    joinOperator?: 'and' | 'or'
}

export function DataTableAdvancedToolbar<
    TData,
    TAdapter extends FilterAdapter,
>({
    table,
    debounceMs = 300,
    shallow = false,
    instance,
    onFiltersChange,
    onJoinOperatorChange,
    filters = [],
    joinOperator = 'and',
    className,
    ...props
}: DataTableAdvancedToolbarProps<TData, TAdapter>) {
    const [activeView, setActiveView] =
        React.useState<SavedView<TAdapter> | null>(null)

    // Handle view changes
    const handleViewChange = React.useCallback(
        (view: SavedView<TAdapter> | null) => {
            setActiveView(view)

            if (view) {
                const { savedFields } = view

                // Apply filters and join operator if saved
                if (savedFields.filters) {
                    onFiltersChange?.(view.filters)
                    onJoinOperatorChange?.(view.joinOperator)
                }

                // Apply sorting if saved
                if (savedFields.sorting && view.sorting) {
                    table.setSorting(view.sorting)
                }

                // Apply column visibility if saved
                if (savedFields.columnVisibility && view.columnVisibility) {
                    table.setColumnVisibility(view.columnVisibility)
                }

                // Apply page size if saved
                if (savedFields.pageSize && view.pageSize) {
                    table.setPageSize(view.pageSize)
                }
            } else {
                // Clear all settings when no view is selected
                onFiltersChange?.([])
                onJoinOperatorChange?.('and')
                table.resetSorting()
                table.resetColumnVisibility()
                table.resetPageSize()
            }
        },
        [onFiltersChange, onJoinOperatorChange, table]
    )

    return (
        <div className="space-y-4">
            <div
                className={cn('flex items-center justify-between', className)}
                {...props}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <DataTableSaveViews
                        table={table}
                        tableId="tasks-table"
                        filters={filters}
                        joinOperator={joinOperator}
                        onViewChange={handleViewChange}
                    />
                    <DataTableFilter
                        instance={instance}
                        onFiltersChange={onFiltersChange}
                        onJoinOperatorChange={onJoinOperatorChange}
                        state={{ filters, joinOperator }}
                    />
                    <DataTableSortList
                        table={table}
                        debounceMs={debounceMs}
                        shallow={shallow}
                    />
                </div>
                <div className="flex items-center">
                    <DataTableViewOptions table={table} />
                </div>
            </div>

            {/* Active filters, sorts and view information */}
            {(filters.length > 0 ||
                table.getState().sorting.length > 0 ||
                activeView) && (
                <div className="flex flex-wrap gap-2">
                    {activeView && (
                        <div className="flex h-7 items-center rounded-md border border-dashed px-2 text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                                Active View:{' '}
                                <span className="text-foreground font-medium">
                                    {activeView.name}
                                </span>
                                {activeView.savedFields.filters &&
                                    filters.length > 0 &&
                                    ' • Filters'}
                                {activeView.savedFields.sorting &&
                                    table.getState().sorting.length > 0 &&
                                    ' • Sorting'}
                                {activeView.savedFields.columnVisibility &&
                                    ' • Column Visibility'}
                                {activeView.savedFields.pageSize &&
                                    ' • Page Size'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-mr-1 ml-1 h-5 w-5"
                                onClick={() => handleViewChange(null)}
                            >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Clear view</span>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
