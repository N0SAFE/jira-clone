import { useQueryState } from 'nuqs'
import { FilterManagerState, FilterMode } from '@repo/ui/components/atomics/organisms/DataTable/filters/types'

export function useFilterUrlState(tableId: string) {
  // Store filter mode in URL
  const [mode, setMode] = useQueryState(
    `${tableId}_mode`,
    {
      defaultValue: 'basic',
      parse: (value: string): FilterMode => 
        value === 'advanced' ? 'advanced' : 'basic'
    }
  )

  // Store basic filters
  const [basicFilters, setBasicFilters] = useQueryState(
    `${tableId}_basic`,
    {
      defaultValue: '[]',
      parse: (value: string) => {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
    }
  )

  // Store advanced filter state
  const [advancedFilter, setAdvancedFilter] = useQueryState(
    `${tableId}_advanced`,
    {
      defaultValue: 'null',
      parse: (value: string) => {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }
    }
  )

  // Helper function to update all filter state at once
  const setFilterState = (state: FilterManagerState) => {
    setMode(state.mode)
    setBasicFilters(JSON.stringify(state.filters))
    setAdvancedFilter(JSON.stringify(state.advancedFilter))
  }

  // Helper function to get the current filter state
  const getFilterState = (): FilterManagerState => ({
    mode: mode || 'basic',
    filters: basicFilters ? JSON.parse(basicFilters) : [],
    advancedFilter: advancedFilter ? JSON.parse(advancedFilter) : null
  })

  return {
    filterState: getFilterState(),
    setFilterState
  }
}