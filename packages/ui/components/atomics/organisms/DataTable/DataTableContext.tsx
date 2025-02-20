import { UniqueIdentifier } from '@dnd-kit/core'
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    RowModel,
    SortingState,
    Table,
    TableOptions,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table'
import React from 'react'

const DataTableContext = React.createContext<{
    table: Table<any> | null
}>({
    table: null,
})

export type DataTableProviderProps<
    TData extends { uuid: UniqueIdentifier },
    TValue,
> = {
    tableOptions?: Omit<
        TableOptions<TData>,
        'data' | 'columns' | 'getCoreRowModel'
    > & {
        getCoreRowModel?: (table: Table<any>) => () => RowModel<any>
    }
    columns: ColumnDef<TData, TValue>[]
    data: TData[] | undefined
    tableRef?: React.RefObject<Table<TData>>
}

const DataTableProvider = <TData extends { uuid: UniqueIdentifier }, TValue>({
    children,
    tableOptions,
    data,
    columns,
    tableRef,
}: React.PropsWithChildren<DataTableProviderProps<TData, TValue>>) => {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        ...tableOptions, // can override the above
        data: data ?? [],
        columns: columns ?? [],
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            ...tableOptions?.state,
        },
    })
    React.useImperativeHandle(tableRef, () => table, [table])

    return (
        <DataTableContext.Provider value={{ table: table }}>
            {children}
        </DataTableContext.Provider>
    )
}

const useDataTableContext = (
    message?: string
): {
    table: Table<any>
} => {
    const context = React.useContext(DataTableContext)

    if (!context || !context.table) {
        throw new Error(
            message
                ? message
                : 'useDataTableContext must be used within a DataTableProvider'
        )
    }

    return context as {
        table: Table<any>
    }
}

export { DataTableContext, useDataTableContext, DataTableProvider }
