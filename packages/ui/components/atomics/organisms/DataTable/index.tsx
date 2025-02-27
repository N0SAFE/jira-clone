'use client'

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
    Table as TableType,
    TableMeta,
    TableOptions,
    Row,
    RowModel,
} from '@tanstack/react-table'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@repo/ui/components/shadcn/table'
import React, { CSSProperties, PointerEvent, useEffect } from 'react'
import Loader from '@repo/ui/components/atomics/atoms/Loader'
import { DataTablePagination } from './DataTablePagination'
import { cn } from '@repo/ui/lib/utils'
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    PointerSensor,
    PointerSensorOptions,
    Sensor,
    TouchSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import For from '@repo/ui/components/atomics/atoms/For'
import { useDataTableContext } from './DataTableContext'

interface FilterCondition {
    id: string
    column: string
    operator: string
    value: string
}

interface AdvancedFilterOptions {
    conditions: FilterCondition[]
    logicOperator: 'AND' | 'OR'
}

// Custom table meta to support advanced filtering
declare module '@tanstack/react-table' {
    interface TableMeta<TData> {
        advancedFilter?: AdvancedFilterOptions
    }
}

interface DataTableProps<TData extends { uuid: UniqueIdentifier }>
    extends React.ComponentProps<typeof Table> {
    tableClassName?: string
    className?: string
    divClassname?: string
    isLoading?: boolean
    isLoadingMore?: boolean
    notFound?: React.ReactNode
    useDragabble?: boolean
    rowIsDraggable?: boolean
    onReorder?: (event: DragEndEvent) => void
    useId?: string
    row?: any
    sensor?: {
        disableMouse?: boolean
        disableTouch?: boolean
        disableKeyboard?: boolean
    }
}

function DraggableRow<TData extends { uuid: UniqueIdentifier }>({
    row,
    rowIsDraggable,
}: {
    row: Row<TData>
    rowIsDraggable?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: row.original?.uuid ?? '',
        disabled: !rowIsDraggable,
    })

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            data-state={row.getIsSelected() && 'selected'}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                    )}
                </TableCell>
            ))}
        </TableRow>
    )
}

export function DataTable<TData extends { uuid: UniqueIdentifier }>({
    isLoading,
    isLoadingMore,
    notFound,
    tableClassName,
    className,
    divClassname,
    useDragabble,
    rowIsDraggable,
    onReorder,
    useId,
    row,
    sensor: {
        disableMouse = false,
        disableTouch = false,
        disableKeyboard = false,
    } = {},
    ...props
}: DataTableProps<TData>) {
    const { table } = useDataTableContext('DataTable has to be render inside a DataTableProvider')

    const sensors = useSensors(
        useSensor(disableMouse ? { activators: [] } : MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(disableTouch ? { activators: [] } : TouchSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(disableKeyboard ? { activators: [] } : KeyboardSensor, {})
    )

    // Custom filtering logic for advanced filtering
    useEffect(() => {
        if (table?.options.meta?.advancedFilter) {
            table.setColumnFilters([]) // Clear column filters when using advanced filter
            
            const { conditions, logicOperator } = table.options.meta.advancedFilter
            
            // Apply the custom filter function
            const filterFn = (row: Row<TData>) => {
                if (conditions.length === 0) return true
                
                const results = conditions.map(condition => {
                    const { column, operator, value } = condition
                    if (!column || !value) return true
                    
                    const cellValue = String(row.getValue(column) || '').toLowerCase()
                    const searchValue = value.toLowerCase()
                    
                    switch (operator) {
                        case 'contains':
                            return cellValue.includes(searchValue)
                        case 'equals':
                            return cellValue === searchValue
                        case 'startsWith':
                            return cellValue.startsWith(searchValue)
                        case 'endsWith':
                            return cellValue.endsWith(searchValue)
                        default:
                            return true
                    }
                })
                
                return logicOperator === 'AND' 
                    ? results.every(result => result)
                    : results.some(result => result)
            }
            
            // Filter the rows manually
            const filteredRows = table.getRowModel().rows.filter(filterFn)
            
            // Update the table state to reflect the filtered rows
            table.options.data = filteredRows.map(row => row.original)
            
        } else {
            // Reset to original data if no advanced filter
            // This is handled by the table automatically
        }
    }, [table?.options.meta?.advancedFilter])
    
    const dataIds = React.useMemo(
        () => table?.options?.data?.map((data) => data.uuid) ?? [],
        [table?.options?.data]
    )

    return (
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onReorder}
            sensors={sensors}
        >
            <div
                className={cn(
                    'flex h-full flex-col justify-between gap-4 overflow-hidden',
                    className
                )}
            >
                {isLoading && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black opacity-70">
                        <Loader size="8" />
                    </div>
                )}

                <div
                    className={cn(
                        'max-h-full overflow-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent',
                        divClassname
                    )}
                >
                    <Table
                        className={cn(
                            'relative h-10 w-full table-auto overflow-clip',
                            tableClassName
                        )}
                    >
                        <TableHeader className="border-border bg-secondary sticky top-0 z-10 h-10 w-full rounded-t-md border-b-2">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {isLoadingMore && (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            table.options.columns.length
                                        }
                                        className="h-24 text-center"
                                    >
                                        <span className="flex items-center justify-center">
                                            <Loader size="5" />
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )}

                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            table.options.columns.length
                                        }
                                        className="h-24 text-center"
                                    ></TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                <SortableContext
                                    items={useDragabble ? dataIds : []}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {row ? (
                                        <For each={table.getRowModel().rows}>
                                            {(rowData) => row(rowData)}
                                        </For>
                                    ) : (
                                        <For each={table.getRowModel().rows}>
                                            {(row) => (
                                                <DraggableRow
                                                    row={row}
                                                    rowIsDraggable={
                                                        useDragabble
                                                            ? rowIsDraggable
                                                            : false
                                                    }
                                                />
                                            )}
                                        </For>
                                    )}
                                </SortableContext>
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            table.options.columns.length
                                        }
                                        className="h-24 text-center"
                                    >
                                        {notFound
                                            ? typeof notFound == 'string'
                                                ? <span className="flex items-center justify-center">{notFound}</span>
                                                : notFound
                                            : null}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DndContext>
    )
}
