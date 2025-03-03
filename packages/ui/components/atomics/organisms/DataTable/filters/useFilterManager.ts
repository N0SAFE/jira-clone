import { useState, useEffect, useCallback } from 'react'
import { FilterConfiguration, FilterManagerState, FilterMode } from './types'
import { FilterManager } from './FilterManager'
import { useDataTableContext } from '../DataTableContext'

interface UseFilterManagerOptions {
  config: FilterConfiguration
  initialState?: FilterManagerState
  onChange?: (state: FilterManagerState) => void
}

export function useFilterManager({ 
  config, 
  initialState,
  onChange
}: UseFilterManagerOptions) {
  const { table } = useDataTableContext('useFilterManager must be used inside a DataTableProvider')
  
  // Keep track of the filter mode (basic/advanced)
  const [mode, setMode] = useState<FilterMode>(
    initialState?.mode || config.defaultMode || 'basic'
  )
  
  // Create and store the FilterManager instance
  const [filterManager] = useState(() => {
    // Enhance the configuration to inject filterSystem into the context
    const enhancedConfig: FilterConfiguration = {
      ...config,
      filters: config.filters.map(filter => ({
        ...filter,
        // We'll inject the filterSystem later, after it's created
      }))
    };
    
    const manager = new FilterManager(
      enhancedConfig,
      initialState,
      (state) => {
        // Update table filtering
        if (table) {
          if (state.advancedFilter) {
            table.setColumnFilters([]) // Clear column filters
            table.options.meta = {
              ...(table.options.meta || {}),
              advancedFilter: state.advancedFilter
            }
          } else {
            // Apply basic filters
            state.filters.forEach(filter => {
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
        
        // Call external onChange handler with the full state
        onChange?.({
          ...state,
          mode,
        })
      }
    );
    
    // Now inject the filterSystem into each filter context
    manager.getState().filters.forEach(filter => {
      const filterConfig = manager.getFilterConfig(filter.id);
      if (filterConfig) {
        filterConfig.context = {
          ...filterConfig.context,
          filterSystem: manager.getFilterSystem()
        };
      }
    });
    
    return manager;
  })
  
  // Change mode (basic/advanced)
  const handleModeChange = useCallback((newMode: FilterMode) => {
    // Clear filters when switching modes
    filterManager.clearAllFilters()
    setMode(newMode)
  }, [filterManager])
  
  // Update filter manager when initialState changes
  useEffect(() => {
    if (initialState) {
      // Set mode
      if (initialState.mode) {
        setMode(initialState.mode)
      }
      
      // Apply filters from initialState
      if (initialState.mode === 'advanced' && initialState.advancedFilter) {
        filterManager.setAdvancedFilter(initialState.advancedFilter)
      } else if (initialState.filters) {
        // Apply each basic filter
        initialState.filters.forEach(filter => {
          if (filter.value && filter.value !== '__all__') {
            filterManager.setFilter(filter.id, filter.value)
            
            if (filter.operator) {
              filterManager.setFilterOperator(filter.id, filter.operator)
            }
          }
        })
      }
    }
  }, [initialState, filterManager])
  
  return {
    mode,
    setMode: handleModeChange,
    filterManager,
    getState: () => ({
      ...filterManager.getState(),
      mode
    })
  }
}