/** @jsxImportSource react */
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/shadcn/select'
import { Input } from '@repo/ui/components/shadcn/input'
import { getFilterInputComponent, getOperatorsForFilter } from './FilterInputs'
import { 
  FilterConfiguration, 
  AdvancedFilterState, 
  FilterOperator,
  FilterState,
  FilterManagerState,
  FilterCondition as BaseFilterCondition
} from './types'
import { FilterManager } from './FilterManager'

interface AdvancedFilterComponentProps {
  config: FilterConfiguration
  filterManager: FilterManager
  state: FilterManagerState
}

interface FilterCondition {
  id: string
  column: string
  operator: string
  value: any
}

export function AdvancedFilterComponent({
  config,
  filterManager,
  state
}: AdvancedFilterComponentProps) {
  // Local state for active conditions
  const [conditions, setConditions] = useState<FilterCondition[]>(
    state.advancedFilter?.conditions || [
      { id: Date.now().toString(), column: '', operator: 'contains', value: '' }
    ]
  )
  
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    state.advancedFilter?.logicOperator || config.defaultLogicOperator || 'AND'
  )

  // Use ref to track if update comes from props
  const isUpdatingFromProps = useRef(false)
  
  // Use ref to track previous state to prevent unnecessary updates
  const prevStateRef = useRef(state.advancedFilter)

  // Access the filter system
  const filterSystem = filterManager.getFilterSystem()

  // Effect to update from state changes
  useEffect(() => {
    // Skip if state hasn't changed meaningfully
    if (JSON.stringify(prevStateRef.current) === JSON.stringify(state.advancedFilter)) {
      return
    }

    prevStateRef.current = state.advancedFilter

    if (state.advancedFilter) {
      isUpdatingFromProps.current = true
      setLogicOperator(state.advancedFilter.logicOperator)
      // Map conditions from filter state to UI state
      setConditions(
        state.advancedFilter.conditions.map((condition: BaseFilterCondition) => ({
          id: condition.id || `${Date.now()}-${Math.random()}`,
          column: condition.field,
          operator: condition.operator,
          value: condition.value
        }))
      )
      // Use setTimeout to ensure state updates are complete before clearing flag
      setTimeout(() => {
        isUpdatingFromProps.current = false
      }, 0)
    }
  }, [state.advancedFilter])

  // Get the filter configuration for a specific column
  const getFilterConfig = (columnId: string) => {
    const filterConfig = filterManager.getFilterConfig(columnId)
    if (!filterConfig) return undefined

    // Add filterSystem to context if not present
    if (filterConfig && !filterConfig.context?.filterSystem) {
      return {
        ...filterConfig,
        context: {
          ...filterConfig.context,
          filterSystem
        }
      }
    }
    return filterConfig
  }

  // Get operators for a column based on its filter type
  const getOperatorsForColumn = (columnId: string) => {
    const filterConfig = getFilterConfig(columnId)
    if (!filterConfig) return []
    return getOperatorsForFilter(filterConfig, filterSystem)
  }

  const handleColumnChange = (conditionId: string, columnId: string) => {
    if (isUpdatingFromProps.current) return

    setConditions(conditions.map((c) => {
      if (c.id === conditionId) {
        const filterConfig = getFilterConfig(columnId)
        if (!filterConfig) return c
        
        // Reset operator to default for this type
        const operators = getOperatorsForColumn(columnId)
        const defaultOperator = filterConfig.defaultOperator || 
          (operators.length > 0 ? operators[0].value : 'contains')
        
        // Update the condition
        return {
          ...c,
          column: columnId,
          operator: defaultOperator,
          value: null
        }
      }
      return c
    }))
    
    // Debounce the filter manager update
    const timeoutId = setTimeout(() => {
      updateFilterManager()
    }, 0)

    return () => clearTimeout(timeoutId)
  }

  const handleOperatorChange = (conditionId: string, operator: string) => {
    if (isUpdatingFromProps.current) return

    setConditions(conditions.map((c) => {
      if (c.id === conditionId) {
        return {
          ...c,
          operator,
          value: null // Reset value when operator changes
        }
      }
      return c
    }))
    
    // Debounce the filter manager update
    const timeoutId = setTimeout(() => {
      updateFilterManager()
    }, 0)

    return () => clearTimeout(timeoutId)
  }

  const handleValueChange = (conditionId: string, value: any) => {
    if (isUpdatingFromProps.current) return

    setConditions(conditions.map((c) => {
      if (c.id === conditionId) {
        return { ...c, value }
      }
      return c
    }))
    
    // Debounce the filter manager update
    const timeoutId = setTimeout(() => {
      updateFilterManager()
    }, 0)

    return () => clearTimeout(timeoutId)
  }

  const handleAddCondition = () => {
    if (isUpdatingFromProps.current) return

    const newCondition = {
      id: `${Date.now()}-${Math.random()}`,
      column: config.filters[0].id,
      operator: config.filters[0].defaultOperator || 'equals',
      value: null
    }
    
    setConditions([...conditions, newCondition])
    
    // Debounce the filter manager update
    const timeoutId = setTimeout(() => {
      updateFilterManager()
    }, 0)

    return () => clearTimeout(timeoutId)
  }

  const handleRemoveCondition = (conditionId: string) => {
    if (isUpdatingFromProps.current) return

    setConditions(conditions.filter(c => c.id !== conditionId))
    
    // Debounce the filter manager update
    const timeoutId = setTimeout(() => {
      updateFilterManager()
    }, 0)

    return () => clearTimeout(timeoutId)
  }

  const handleLogicOperatorChange = (value: 'AND' | 'OR') => {
    if (isUpdatingFromProps.current) return

    setLogicOperator(value)
    
    // Debounce the filter manager update
    const timeoutId = setTimeout(() => {
      updateFilterManager()
    }, 0)

    return () => clearTimeout(timeoutId)
  }

  const updateFilterManager = () => {
    // Don't update filter manager if the change came from props
    if (isUpdatingFromProps.current) return

    const advancedFilter = {
      logicOperator,
      conditions: conditions.map(c => ({
        id: c.column,
        field: c.column,
        operator: c.operator,
        value: c.value
      }))
    }
    
    // Skip update if nothing has changed
    if (JSON.stringify(prevStateRef.current) === JSON.stringify(advancedFilter)) {
      return
    }

    prevStateRef.current = advancedFilter
    filterManager.setAdvancedFilter(advancedFilter)
  }

  return (
    <div className="space-y-4">
      {/* Logic operator selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Match</span>
        <Select
          value={logicOperator}
          onValueChange={value => handleLogicOperatorChange(value as 'AND' | 'OR')}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">All conditions</SelectItem>
            <SelectItem value="OR">Any condition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditions */}
      {conditions.map(condition => {
        const filterConfig = getFilterConfig(condition.column)
        if (!filterConfig) return null

        const FilterInput = getFilterInputComponent(
          filterConfig.filterType,
          condition.operator,
          filterSystem
        )

        const operators = getOperatorsForColumn(condition.column)

        return (
          <div key={condition.id} className="flex items-start gap-2">
            {/* Column selector */}
            <Select
              value={condition.column}
              onValueChange={(value) => handleColumnChange(condition.id, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {config.filters.map(filter => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator selector */}
            <Select
              value={condition.operator}
              onValueChange={(value) => handleOperatorChange(condition.id, value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {operators.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value input */}
            {FilterInput ? (
              <FilterInput
                filterId={filterConfig.id}
                config={filterConfig}
                value={condition.value}
                onChange={(_, value) => handleValueChange(condition.id, value)}
                context={filterConfig.context}
              />
            ) : (
              <Input
                value={condition.value || ''}
                onChange={(e) => handleValueChange(condition.id, e.target.value)}
                placeholder="Value"
                className="h-8 w-[150px]"
              />
            )}

            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveCondition(condition.id)}
            >
              Remove
            </Button>
          </div>
        )
      })}

      {/* Add condition button */}
      <Button onClick={handleAddCondition}>
        Add Condition
      </Button>
    </div>
  )
}