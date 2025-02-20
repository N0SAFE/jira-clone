import { Table } from '@tanstack/react-table'
import { useRef } from 'react'

export default function useTableRef<TData>() {
    return useRef<Table<TData>>(null)
}
