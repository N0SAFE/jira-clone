import { useFilters } from '@repo/ui/hooks/use-filters'
import { directusFilterAdapter } from '@repo/ui/config/filters/adapter/directus.adapter'
import { Filter } from '@repo/ui/types/data-table'

export const useFilterInstance = <T extends Filter<any>>(
    state: {
        filters: T[]
        joinOperator: 'and' | 'or'
    },
    config: {},
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
        ],
        {
            onChange,
            state,
        }
    )
