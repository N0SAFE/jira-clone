/** @jsxImportSource react */
'use client'

import React from 'react'
import { FilterConfiguration, FilterManagerState } from './filters/types'
import { DataTableFilter } from './DataTableFilter'

interface DataTableFiltersProps {
  config: FilterConfiguration
  initialState?: FilterManagerState
  onFilterChange?: (state: FilterManagerState) => void
}

// This component now serves as a simple wrapper around DataTableFilter
// for backward compatibility with existing code
export function DataTableFilters({
  config,
  initialState,
  onFilterChange
}: DataTableFiltersProps) {
  return (
    <DataTableFilter
      config={config}
      initialState={initialState}
      onFilterChange={onFilterChange}
    />
  )
}