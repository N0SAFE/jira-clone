'use client'

import { useState } from 'react'
import { FilterMode, FilterConfiguration, FilterManagerState } from './filters/types'
import { FilterManager } from './filters/FilterManager'
import { Button } from '@repo/ui/components/shadcn/button'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'
import { DataTableFilter } from './DataTableFilter'
import { cn } from '@repo/ui/lib/utils'

interface DataTableFiltersProps {
  config: FilterConfiguration
  initialState?: FilterManagerState
  onFilterChange?: (state: FilterManagerState) => void
}

export function DataTableFilters({
  config,
  initialState,
  onFilterChange
}: DataTableFiltersProps) {
  const [mode, setMode] = useState<FilterMode>(
    initialState?.mode || config.defaultMode || 'basic'
  )
  const [filterManager] = useState(() => new FilterManager(
    config,
    initialState,
    (state) => {
      // Pass the current mode with the state
      onFilterChange?.({
        ...state,
        mode
      })
    }
  ))

  const handleModeChange = (newMode: FilterMode) => {
    // Clear filters when switching modes
    filterManager.clearAllFilters()
    setMode(newMode)
  }

  return (
    <div className="space-y-2">
      {config.enableAdvancedFilter && (
        <div className="flex justify-end">
          <Tabs
            value={mode}
            onValueChange={(value) => handleModeChange(value as FilterMode)}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Filter</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Filter</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {mode === 'basic' ? (
        <DataTableFilter 
          mode="basic"
          config={config}
          initialState={initialState}
          onFilterChange={onFilterChange}
        />
      ) : (
        <DataTableFilter
          mode="advanced"
          config={config}
          initialState={initialState}
          onFilterChange={onFilterChange}
        />
      )}
    </div>
  )
}