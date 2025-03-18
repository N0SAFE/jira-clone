import {
    Cell,
    Column,
    Row,
    type Table as TanstackTable,
    flexRender,
} from '@tanstack/react-table'
import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/ui/components/shadcn/table'
import { cn } from '@repo/ui/lib/utils'
import { Loader } from 'lucide-react'
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DataTableSortableRow } from './DataTableSortableRow'

/**
 * Generate common pinning styles for a table column.
 *
 * This function calculates and returns CSS properties for pinned columns in a data table.
 * It handles both left and right pinning, applying appropriate styles for positioning,
 * shadows, and z-index. The function also considers whether the column is the last left-pinned
 * or first right-pinned column to apply specific shadow effects.
 *
 * @param options - The options for generating pinning styles.
 * @param options.column - The column object for which to generate styles.
 * @param options.withBorder - Whether to show a box shadow between pinned and scrollable columns.
 * @returns A React.CSSProperties object containing the calculated styles.
 */
export function getCommonPinningStyles<TData>({
    column,
    withBorder = false,
}: {
    column: Column<TData>
    /**
     * Show box shadow between pinned and scrollable columns.
     * @default false
     */
    withBorder?: boolean
}): React.CSSProperties {
    const isPinned = column.getIsPinned()
    const isLastLeftPinnedColumn =
        isPinned === 'left' && column.getIsLastColumn('left')
    const isFirstRightPinnedColumn =
        isPinned === 'right' && column.getIsFirstColumn('right')
    return {
        boxShadow: withBorder
            ? isLastLeftPinnedColumn
                ? '-4px 0 4px -4px hsl(var(--border)) inset'
                : isFirstRightPinnedColumn
                  ? '4px 0 4px -4px hsl(var(--border)) inset'
                  : undefined
            : undefined,
        left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
        right:
            isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
        opacity: isPinned ? 0.97 : 1,
        position: isPinned ? 'sticky' : 'relative',
        background: isPinned
            ? 'hsl(var(--background))'
            : 'hsl(var(--background))',
        width: column.getSize(),
        zIndex: isPinned ? 1 : 0,
    }
}

interface DataTableProps<TData> extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * The table instance returned from useDataTable hook with pagination, sorting, filtering, etc.
     * @type TanstackTable<TData>
     */
    table: TanstackTable<TData>
    /**
     * The floating bar to render at the bottom of the table on row selection.
     * @default null
     * @type React.ReactNode | null
     * @example floatingBar={<TasksTableFloatingBar table={table} />}
     */
    floatingBar?: React.ReactNode | null
    /**
     * Array of row IDs that are currently in a loading state
     * @default []
     */
    loadingRows?: string[]
    /**
     * Function to render expanded row content
     * If provided, rows will be expandable
     */
    renderExpandedRow?: (rowData: TData) => React.ReactNode
    /**
     * Expanded row IDs
     * This is an external state so parent component can control expansion
     */
    expandedRowIds?: string[]
    /**
     * Handler for row expansion changes
     */
    onExpandedRowIdsChange?: (rowIds: string[]) => void
    /**
     * Enable row reordering via drag and drop
     * @default false
     */
    enableRowReordering?: boolean
    /**
     * Callback when rows are reordered
     */
    onRowReorder?: (rowIds: string[]) => void
    /**
     * function to render custom row
     */
    renderRow?: (
        rowData: Row<TData>,
        content: React.ReactNode
    ) => React.ReactNode
    /**
     * function to render custom cell
     */
    renderCell?: (
        cell: Cell<TData, unknown>,
        content: React.ReactNode
    ) => React.ReactNode
}

export function DataTable<TData>({
    table,
    floatingBar = null,
    loadingRows = [],
    renderExpandedRow,
    expandedRowIds = [],
    onExpandedRowIdsChange,
    enableRowReordering = false,
    onRowReorder,
    children,
    className,
    renderRow,
    renderCell,
    ...props
}: DataTableProps<TData>) {
    // Internal state for expanded rows if not controlled externally
    const [internalExpandedRowIds, setInternalExpandedRowIds] = useState<
        string[]
    >([])

    // Use either controlled or uncontrolled expansion state
    const effectiveExpandedRowIds = onExpandedRowIdsChange
        ? expandedRowIds
        : internalExpandedRowIds

    // Toggle row expansion
    const toggleRowExpanded = useCallback(
        (rowId: string) => {
            const newExpandedRowIds = effectiveExpandedRowIds.includes(rowId)
                ? effectiveExpandedRowIds.filter((id) => id !== rowId)
                : [...effectiveExpandedRowIds, rowId]

            if (onExpandedRowIdsChange) {
                onExpandedRowIdsChange(newExpandedRowIds)
            } else {
                setInternalExpandedRowIds(newExpandedRowIds)
            }
        },
        [effectiveExpandedRowIds, onExpandedRowIdsChange]
    )

    // Setup DnD sensors for keyboard, mouse, and touch interactions
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8, // 8px of movement required before activating
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms delay for touch
                tolerance: 8, // 8px tolerance
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Get row IDs for sortable context
    const rowIds = useMemo(
        () => table.getRowModel().rows.map((row) => row.id),
        [table.getRowModel().rows]
    )

    // Handle drag end event
    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event

            if (over && active.id !== over.id) {
                const oldIndex = rowIds.indexOf(active.id as string)
                const newIndex = rowIds.indexOf(over.id as string)

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(rowIds, oldIndex, newIndex)
                    onRowReorder?.(newOrder)
                }
            }
        },
        [rowIds, onRowReorder]
    )

    const _renderRow = function (
        row: Row<TData>,
        content: (children: React.ReactNode) => React.ReactNode,
        children: React.ReactNode
    ) {
        return renderRow ? renderRow(row, children) : content(children)
    }

    const _renderCell = function (
        cell: Cell<TData, unknown>,
        content: (children: React.ReactNode) => React.ReactNode,
        children: React.ReactNode
    ) {
        return renderCell
            ? renderCell(cell, children)
            : content(children)
    }

    const MemorizedRow = useCallback(
        ({ row, children }: { row: Row<TData>; children: React.ReactNode }) => {
            return renderRow ? (
                renderRow(row, children)
            ) : enableRowReordering ? (
                <DataTableSortableRow
                    id={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    role="row"
                >
                    {children}
                </DataTableSortableRow>
            ) : (
                <TableRow data-state={row.getIsSelected() && 'selected'} role="row">
                    {children}
                </TableRow>
            )
        },
        [renderRow, enableRowReordering]
    )

    // Wrap with DndContext if row reordering is enabled
    const tableContent = (
        <div className="overflow-hidden rounded-md border">
            <Table
                role="grid"
                aria-label="Data table"
                aria-rowcount={table.getRowModel().rows.length}
                aria-colcount={table.getAllColumns().length}
            >
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} role="row">
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    role="columnheader"
                                    aria-sort={
                                        header.column.getIsSorted()
                                            ? header.column.getIsSorted() ===
                                              'desc'
                                                ? 'descending'
                                                : 'ascending'
                                            : 'none'
                                    }
                                    style={{
                                        ...getCommonPinningStyles({
                                            column: header.column,
                                        }),
                                    }}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row, rowIndex) => {
                            const isRowLoading = loadingRows.includes(row.id)
                            const isExpanded = effectiveExpandedRowIds.includes(
                                row.id
                            )

                            return (
                                <React.Fragment key={row.id}>
                                    <MemorizedRow row={row}>
                                        {row
                                            .getVisibleCells()
                                            .map((cell, cellIndex) =>
                                                _renderCell(
                                                    cell,
                                                    (children) => (
                                                        <TableCell
                                                            key={cell.id}
                                                            role="gridcell"
                                                            aria-colindex={
                                                                cellIndex + 1
                                                            }
                                                            style={{
                                                                ...getCommonPinningStyles(
                                                                    {
                                                                        column: cell.column,
                                                                    }
                                                                ),
                                                            }}
                                                        >
                                                            {children}
                                                        </TableCell>
                                                    ),
                                                    flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )
                                                )
                                            )}

                                        {isRowLoading && (
                                            <div
                                                className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]"
                                                aria-live="polite"
                                            >
                                                <Loader
                                                    className="text-primary size-4 animate-spin"
                                                    aria-label="Chargement"
                                                />
                                            </div>
                                        )}
                                    </MemorizedRow>

                                    {/* Expanded row content */}
                                    {isExpanded && renderExpandedRow && (
                                        <TableRow
                                            className="border-b-0"
                                            role="row"
                                            aria-rowindex={rowIndex + 2}
                                        >
                                            <TableCell
                                                colSpan={
                                                    row.getVisibleCells().length
                                                }
                                                className="p-0"
                                                role="gridcell"
                                            >
                                                {renderExpandedRow(
                                                    row.original
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            )
                        })
                    ) : (
                        <TableRow role="row">
                            <TableCell
                                colSpan={table.getAllColumns().length}
                                className="h-24 text-center"
                                role="gridcell"
                            >
                                Aucun résultat.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div
            className={cn('w-full space-y-2.5 overflow-auto', className)}
            {...props}
        >
            {children}
            {enableRowReordering ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={rowIds}
                        strategy={verticalListSortingStrategy}
                    >
                        {tableContent}
                    </SortableContext>
                </DndContext>
            ) : (
                tableContent
            )}
        </div>
    )
}
