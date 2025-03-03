/** @jsxImportSource react */
'use client'

import React from 'react'
import { useDataTableContext } from './DataTableContext'
import { 
  FilterConfiguration, 
  FilterManagerState,
  FilterMode
} from './filters/types'
import { useFilterManager } from './filters/useFilterManager'
import { BasicFilterComponent } from './filters/BasicFilterComponent'
import { AdvancedFilterComponent } from './filters/AdvancedFilterComponent'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/shadcn/tabs'

interface DataTableFilterProps {
  config: FilterConfiguration
  initialState?: FilterManagerState
  onFilterChange?: (state: FilterManagerState) => void
}

const defaultFilterState: FilterManagerState = {
  filters: [],
  mode: 'basic'
}

export function DataTableFilter({ 
  config,
  initialState,
  onFilterChange
}: DataTableFilterProps) {
  // Use our custom hook for filter state management
  const {
    mode,
    setMode,
    filterManager,
  } = useFilterManager({
    config,
    state: initialState || defaultFilterState,
    onChange: onFilterChange
  })

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      {config.enableAdvancedFilter && (
        <div className="flex justify-end">
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as FilterMode)}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Filter</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Filter</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Render appropriate filter component based on mode */}
      {mode === 'basic' ? (
        <BasicFilterComponent 
          config={config} 
          filterManager={filterManager}
          state={filterManager.getState()}
        />
      ) : (
        <AdvancedFilterComponent
          config={config}
          filterManager={filterManager} 
          state={filterManager.getState()}
        />
      )}
    </div>
  )
}