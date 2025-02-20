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

interface DataTableProps<TData extends { uuid: UniqueIdentifier }>
    extends React.ComponentProps<typeof Table> {
    tableClassName?: string
    isLoading?: boolean
    isLoadingMore?: boolean
    notFound?: React.ReactNode
    useDragabble?: boolean
    rowIsDraggable?: boolean
    sensor?: {
        disableMouse?: boolean
        disableTouch?: boolean
        disableKeyboard?: boolean
    }
    onReorder?: (event: DragEndEvent) => void
    useId?: (data: TData) => UniqueIdentifier
    row?: (row: Row<TData>) => React.ReactNode
}

function DraggableRow<TData extends { uuid: UniqueIdentifier }>({
    row,
    rowIsDraggable,
}: {
    row: Row<TData>
    rowIsDraggable?: boolean
}) {
    const {
        transform,
        transition,
        setNodeRef,
        isDragging,
        attributes,
        listeners,
    } = useSortable({
        id: row.original.uuid,
    })

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
        transition: transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    }
    return (
        // connect row ref to dnd-kit, apply important styles
        <TableRow
            ref={setNodeRef}
            style={style}
            data-state={row.getIsSelected() && 'selected'}
            {...(rowIsDraggable
                ? {
                      ...attributes,
                      ...listeners,
                  }
                : {})}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
    const { table } = useDataTableContext(
        'DataTable has to be render inside a DataTableProvider'
    )

    const sensors = useSensors(
        useSensor(
            disableMouse
                ? ({ activators: [] as any[] } as Sensor<any>)
                : MouseSensor,
            { activationConstraint: { distance: 5 } }
        ),
        useSensor(
            disableTouch
                ? ({ activators: [] as any[] } as Sensor<any>)
                : TouchSensor,
            { activationConstraint: { distance: 5 } }
        ),
        useSensor(
            disableKeyboard
                ? ({ activators: [] as any[] } as Sensor<any>)
                : KeyboardSensor,
            {}
        )
    )

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () =>
            table?.options?.data?.map((data) => data.uuid) ??
            ([] as UniqueIdentifier[]),
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
                <div className="border-border relative overflow-hidden rounded-md border">
                    {isLoadingMore && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black opacity-70">
                            <Loader size="8" />
                        </div>
                    )}
                    <Table
                        className={cn(
                            'relative h-10 w-full table-auto overflow-clip',
                            tableClassName
                        )}
                        divClassname={cn(
                            'max-h-full overflow-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent',
                            divClassname
                        )}
                    >
                        <TableHeader className="border-border bg-secondary sticky top-0 z-10 h-10 w-full rounded-t-md border-b-2">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={table.options.columns.length}
                                        className="h-24 text-center"
                                    >
                                        <span className="flex items-center justify-center">
                                            <Loader />
                                        </span>
                                    </TableCell>
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
                                                    key={row.id}
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
                                        colSpan={table.options.columns.length}
                                        className="h-24 text-center"
                                    >
                                        {notFound ? (
                                            typeof notFound == 'string' ? (
                                                <span className="flex items-center justify-center">
                                                    {notFound}
                                                </span>
                                            ) : (
                                                notFound
                                            )
                                        ) : null}
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
