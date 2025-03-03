import { useState, useEffect, useCallback, useRef } from 'react'
import { FilterConfiguration, FilterManagerState, FilterMode, FilterState } from './types'
import { FilterManager } from './FilterManager'
import { useDataTableContext } from '../DataTableContext'

interface UseFilterManagerOptions {
  config: FilterConfiguration
  state: FilterManagerState
  onChange?: (state: FilterManagerState) => void
}

export function useFilterManager({ 
  config, 
  state,
  onChange
}: UseFilterManagerOptions) {
  const { table } = useDataTableContext('useFilterManager must be used inside a DataTableProvider')
  
  // Keep track of the filter mode (basic/advanced)
  const [mode, setMode] = useState<FilterMode>(
    state?.mode || config.defaultMode || 'basic'
  )

  // Use ref to track state updates
  const stateRef = useRef(state)
  const filterManagerRef = useRef<FilterManager | null>(null)
  
  // Create filter manager instance only once
  if (!filterManagerRef.current) {
    filterManagerRef.current = new FilterManager(
      config,
      state,
      (newState) => {
        // Skip if the state hasn't changed meaningfully
        if (JSON.stringify(stateRef.current) === JSON.stringify(newState)) {
          return
        }

        // Schedule state updates in a microtask to avoid updates during render
        Promise.resolve().then(() => {
          // Update table filtering
          if (table) {
            if (newState.advancedFilter) {
              table.setColumnFilters([]) // Clear column filters
              table.options.meta = {
                ...(table.options.meta || {}),
                advancedFilter: newState.advancedFilter
              }
            } else {
              // Apply basic filters
              newState.filters?.forEach((filter: FilterState) => {
                if (filter.value && filter.value !== '__all__') {
                  table.getColumn(filter.id)?.setFilterValue(filter.value)
                } else {
                  table.getColumn(filter.id)?.setFilterValue(undefined)
                }
              })
              
              // Clear advanced filter if exists
              if (table.options.meta?.advancedFilter) {
                table.options.meta = {
                  ...(table.options.meta || {}),
                  advancedFilter: undefined
                }
              }
            }
          }

          // Update ref and notify parent
          stateRef.current = newState
          onChange?.(newState)
        })
      }
    )
  }

  // Change mode (basic/advanced)
  const handleModeChange = useCallback((newMode: FilterMode) => {
    // Clear filters when switching modes
    filterManagerRef.current?.reset()
    setMode(newMode)
  }, [])

  // Update filter manager when external state changes
  useEffect(() => {
    if (!state || JSON.stringify(stateRef.current) === JSON.stringify(state)) {
      return
    }

    // Update ref
    stateRef.current = state

    // Apply mode
    if (state.mode) {
      setMode(state.mode)
    }

    // Apply state to filter manager using the renamed method
    filterManagerRef.current?.setFilterState(state)
  }, [state])

  return {
    mode,
    setMode: handleModeChange,
    filterManager: filterManagerRef.current as FilterManager
  }
}