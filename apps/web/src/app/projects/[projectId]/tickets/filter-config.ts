import { useFilters } from '@repo/ui/hooks/use-filters'
import { directusFilterAdapter } from '@repo/ui/config/filters/adapter/directus.adapter'
import { Filter } from '@repo/ui/types/data-table'

export const useFilterInstance = <T extends Filter<any>>(
    state: {
        filters: T[]
        joinOperator: 'and' | 'or'
    },
    config: {
      statusOptions: { value: number; label: string }[]
      priorityOptions: { value: number; label: string }[]
    },
    onChange: (filters: T[], joinOperator: 'and' | 'or') => void
) =>
    useFilters(
        directusFilterAdapter,
        (createFilter) => [
            createFilter({
                type: 'text',
                id: 'title',
                label: 'Title',
                meta: {
                    placeholder: 'Search by title...',
                    test: 'ter',
                },
            }),
            createFilter({
                type: 'text',
                id: 'description',
                label: 'Description',
                meta: {
                    placeholder: 'Search by description...',
                },
            }),
            createFilter({
                type: 'select',
                id: 'status',
                label: 'Status',
                meta: () => ({
                    options: config.statusOptions,
                    placeholder: 'Select status...',
                }),
            }),
            createFilter({
                type: 'select',
                id: 'priority',
                label: 'Priority',
                meta: () => ({
                    options: config.priorityOptions,
                    placeholder: 'Select priority...',
                }),
            }),
            createFilter({
                type: 'date',
                id: 'createdAt',
                label: 'Created at',
            }),
        ],
        {
            onChange,
            state,
        }
    )
