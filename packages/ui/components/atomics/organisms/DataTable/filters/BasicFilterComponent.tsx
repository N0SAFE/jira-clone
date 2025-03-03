/** @jsxImportSource react */
'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'

import { getFilterInputComponent, getOperatorsForFilter } from './FilterInputs'
import { FilterConfiguration, FilterState } from './types'
import { FilterManager } from './FilterManager'

interface BasicFilterComponentProps {
  config: FilterConfiguration
  filterManager: FilterManager
}

export function BasicFilterComponent({ 
  config,
  filterManager
}: BasicFilterComponentProps) {
  // Track which filters are active in UI
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  // Track filter values for UI display
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  
  // Initialize from filter manager state
  useEffect(() => {
    const state = filterManager.getState()
    
    // Find active filters (with non-empty values)
    const activeFilterIds = state.filters
      .filter(f => f.value && f.value !== '__all__')
      .map(f => f.id)
    
    if (activeFilterIds.length > 0) {
      setActiveFilters(activeFilterIds)
      
      // Initialize filter values
      const values: Record<string, any> = {}
      state.filters.forEach(filter => {
        if (filter.value) {
          values[filter.id] = filter.value
        }
      })
      
      setFilterValues(values)
    }
  }, [filterManager])

  const handleFilterChange = (filterId: string, value: any) => {
    // Update local state for UI display
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value
    }))
    
    // Update filter manager state
    if (value === '__all__') {
      filterManager.clearFilter(filterId)
    } else {
      filterManager.setFilter(filterId, value)
    }
  }

  const addFilter = (filterId: string) => {
    if (!activeFilters.includes(filterId)) {
      setActiveFilters([...activeFilters, filterId])
      
      // Set initial value in local state
      const filterConfig = config.filters.find(f => f.id === filterId)
      const initialValue = filterConfig?.defaultValue ?? 
        (filterConfig?.type === 'select' ? '__all__' : '')
      
      setFilterValues(prev => ({
        ...prev,
        [filterId]: initialValue
      }))
    }
  }

  const removeFilter = (filterId: string) => {
    // Clear from filter manager
    filterManager.clearFilter(filterId)
    
    // Update UI state
    setActiveFilters(activeFilters.filter(id => id !== filterId))
    
    // Remove from local values state
    setFilterValues(prev => {
      const newValues = { ...prev }
      delete newValues[filterId]
      return newValues
    })
  }

  const clearAllFilters = () => {
    filterManager.clearAllFilters()
    setActiveFilters([])
    setFilterValues({})
  }

  // Render the appropriate filter input component
  const renderFilterInput = (filterId: string) => {
    const filterConfig = filterManager.getFilterConfig(filterId)
    if (!filterConfig) return null
    
    // If filter has a custom component defined, use it
    if (filterConfig.component) {
      return (
        <filterConfig.component
          filterId={filterId}
          config={filterConfig}
          value={filterValues[filterId]}
          onChange={handleFilterChange}
          context={filterConfig.context}
        />
      )
    }
    
    // Otherwise use our component factory to get the appropriate input
    const InputComponent = getFilterInputComponent(filterConfig.type)
    return (
      <InputComponent
        filterId={filterId}
        config={filterConfig}
        value={filterValues[filterId]}
        onChange={handleFilterChange}
        context={filterConfig.context}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {activeFilters.map((filterId) => {
          const filterConfig = config.filters.find((f) => f.id === filterId)
          if (!filterConfig) {
            return null;
          }
          
          return (
            <div 
              key={filterId}
              className="flex items-center gap-2 bg-secondary p-2 pr-3 rounded-md"
            >
              <span className="text-sm font-medium">{filterConfig.label}:</span>
              
              {renderFilterInput(filterId)}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeFilter(filterId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        })}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <div className="p-2 space-y-1">
              {config.filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilters.includes(filter.id) ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => addFilter(filter.id)}
                  disabled={activeFilters.includes(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={clearAllFilters}
          >
            Clear filters
          </Button>
        )}

        {activeFilters.length > 0 && (
          <div className="ml-auto">
            <Badge variant="outline" className="h-7 px-3">
              {activeFilters.length} active filter{activeFilters.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}