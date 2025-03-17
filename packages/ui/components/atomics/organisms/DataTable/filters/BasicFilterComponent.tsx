/** @jsxImportSource react */
'use client'

import React from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'

import { getFilterInputComponent, getOperatorsForFilter } from './FilterInputs'
import { FilterConfiguration, FilterState, FilterManagerState } from './types'
import { FilterManager } from './FilterManager'

interface BasicFilterComponentProps {
  config: FilterConfiguration
  filterManager: FilterManager
  state: FilterManagerState
}

export function BasicFilterComponent({
  config,
  filterManager,
  state
}: BasicFilterComponentProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {config.filters.map(filterConfig => {
        // Get the current filter state
        const currentFilter = state.filters?.find(f => f.id === filterConfig.id)
        
        // Get the appropriate input component based on filter type
        const FilterInput = getFilterInputComponent(
          filterConfig.filterType,
          currentFilter?.operator,
          filterManager.getFilterSystem()
        )
        
        return (
          <FilterInput
            key={filterConfig.id}
            filterId={filterConfig.id}
            config={filterConfig}
            value={currentFilter?.value}
            onChange={(id, value) => filterManager.setFilter(id, value)}
            context={filterConfig.context}
          />
        )
      })}
    </div>
  )
}