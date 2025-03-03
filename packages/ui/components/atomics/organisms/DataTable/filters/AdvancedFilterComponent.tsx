/** @jsxImportSource react */
'use client'

import React, { useState, useEffect } from 'react'
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
  FilterState
} from './types'
import { FilterManager } from './FilterManager'

interface AdvancedFilterComponentProps {
  config: FilterConfiguration
  filterManager: FilterManager
  onApply?: () => void
  initialActive?: boolean
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
  onApply,
  initialActive = false
}: AdvancedFilterComponentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: Date.now().toString(), column: '', operator: 'contains', value: '' }
  ])
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    config.defaultLogicOperator || 'AND'
  )
  const [isActive, setIsActive] = useState(initialActive)
  
  // Access the filter system
  const filterSystem = filterManager.getFilterSystem()

  // Effect to initialize from existing advanced filter
  useEffect(() => {
    const state = filterManager.getState()
    if (state.advancedFilter) {
      setIsActive(true)
      setLogicOperator(state.advancedFilter.logicOperator)
      
      // Map conditions from filter state to UI state
      setConditions(
        state.advancedFilter.conditions.map(condition => ({
          id: `${condition.id}-${Date.now()}`,
          column: condition.id,
          operator: condition.operator,
          value: condition.value
        }))
      )
    }
  }, [filterManager])

  // Get the filter configuration for a specific column
  const getFilterConfig = (columnId: string) => {
    const filterConfig = filterManager.getFilterConfig(columnId);
    
    if (!filterConfig) return undefined;
    
    // Add filterSystem to context if not present
    if (filterConfig && !filterConfig.context?.filterSystem) {
      return {
        ...filterConfig,
        context: {
          ...filterConfig.context,
          filterSystem
        }
      };
    }
    
    return filterConfig;
  }

  // Get operators for a column based on its filter type
  const getOperatorsForColumn = (columnId: string): Array<{value: string, label: string}> => {
    const filterConfig = getFilterConfig(columnId)
    if (!filterConfig) return [];
    
    return getOperatorsForFilter(filterConfig, filterSystem);
  }

  const handleColumnChange = (conditionId: string, columnId: string) => {
    setConditions(conditions.map((c) => {
      if (c.id === conditionId) {
        const filterConfig = getFilterConfig(columnId)
        if (!filterConfig) return c;
        
        // Reset operator to default for this type
        const operators = getOperatorsForColumn(columnId)
        const defaultOperator = filterConfig.defaultOperator || 
          (operators.length > 0 ? operators[0].value : 'contains')
        
        return { 
          ...c, 
          column: columnId,
          operator: defaultOperator,
          value: filterConfig.defaultValue ?? '' // Use default value if provided
        }
      }
      return c
    }))
  }

  const handleOperatorChange = (conditionId: string, operator: string) => {
    setConditions(conditions.map((c) => {
      if (c.id === conditionId) {
        // Reset value when changing operators to avoid incompatible values
        const filterConfig = getFilterConfig(c.column)
        
        // Initialize appropriate value type for between operators
        if (operator === 'between') {
          if (filterConfig?.filterType === 'number' || filterConfig?.filterType === 'date') {
            return { ...c, operator, value: [null, null] }
          }
        }
        
        // Special handling for isEmpty/isNotEmpty operators that don't need values
        if (operator === 'isEmpty' || operator === 'isNotEmpty') {
          return { ...c, operator, value: null }
        }
        
        return { ...c, operator, value: '' }
      }
      return c
    }))
  }

  const handleValueChange = (conditionId: string, value: any) => {
    setConditions(conditions.map((c) => 
      c.id === conditionId ? { ...c, value } : c
    ))
  }

  const addCondition = () => {
    if (conditions.length < (config.maxConditions || 5)) {
      setConditions([
        ...conditions,
        { id: Date.now().toString(), column: '', operator: 'contains', value: '' }
      ])
    }
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const applyAdvancedFilter = () => {
    // Filter out incomplete conditions
    const filteredConditions = conditions.filter(c => {
      // Always keep conditions with isEmpty/isNotEmpty operators
      if (c.column && (c.operator === 'isEmpty' || c.operator === 'isNotEmpty')) {
        return true;
      }
      
      // Otherwise check for both column and value
      return c.column && c.value !== undefined && c.value !== null && 
        (typeof c.value !== 'string' || c.value.trim() !== '');
    });
    
    if (filteredConditions.length > 0) {
      // Convert to proper FilterState array
      const filterStates: FilterState[] = filteredConditions.map(c => ({
        id: c.column,
        operator: c.operator as FilterOperator,
        value: c.value
      }))

      filterManager.setAdvancedFilter({
        conditions: filterStates,
        logicOperator
      })
      
      setIsOpen(false)
      setIsActive(true)
      
      if (onApply) {
        onApply();
      }
    }
  }

  const clearAdvancedFilter = () => {
    filterManager.clearAdvancedFilter()
    setIsActive(false)
    // Reset conditions to default
    setConditions([
      { id: Date.now().toString(), column: '', operator: 'contains', value: '' }
    ])
  }

  // Function to render the appropriate input based on filter type and operator
  const renderValueInput = (condition: FilterCondition) => {
    const filterConfig = getFilterConfig(condition.column)
    if (!filterConfig) {
      return null;
    }
    
    // Don't render input for isEmpty/isNotEmpty operators
    if (condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty') {
      return null;
    }

    // If a custom component is provided, use it
    if (filterConfig.component) {
      return (
        <filterConfig.component
          filterId={condition.id}
          config={filterConfig}
          value={condition.value}
          onChange={(_, value) => handleValueChange(condition.id, value)}
          context={filterConfig.context}
        />
      )
    }
    
    // Use our component factory to get the right input component
    const InputComponent = getFilterInputComponent(
      filterConfig.filterType, 
      condition.operator,
      filterSystem
    )
    
    // If we have a component for this filter type
    if (InputComponent) {
      return (
        <InputComponent
          filterId={condition.id}
          config={filterConfig}
          value={condition.value}
          onChange={(_, value) => handleValueChange(condition.id, value)}
          context={filterConfig.context}
        />
      )
    }

    // Default to text input
    return (
      <Input
        value={condition.value || ''}
        onChange={(e) => handleValueChange(condition.id, e.target.value)}
        placeholder="Value"
        className="h-8 w-[150px]"
      />
    )
  }

  return (
    <div className="space-y-2">
      {isActive && !isOpen && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-8"
            onClick={() => setIsOpen(true)}
          >
            Edit Advanced Filter ({conditions.filter(c => c.column && (
              c.operator === 'isEmpty' || 
              c.operator === 'isNotEmpty' || 
              c.value
            )).length} conditions)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={clearAdvancedFilter}
          >
            Clear
          </Button>
        </div>
      )}

      {!isActive && !isOpen && (
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setIsOpen(true)}
        >
          Set up Advanced Filter
        </Button>
      )}

      {isOpen && (
        <div className="bg-card border rounded-md p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Advanced Filter</h4>
            <Select
              value={logicOperator}
              onValueChange={(value: 'AND' | 'OR') => setLogicOperator(value)}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {conditions.map((condition) => (
              <div key={condition.id} className="flex flex-wrap items-center gap-2">
                <Select
                  value={condition.column}
                  onValueChange={(value) => handleColumnChange(condition.id, value)}
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.filters.map((filter) => (
                      <SelectItem key={filter.id} value={filter.id}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {condition.column && (
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => handleOperatorChange(condition.id, value)}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorsForColumn(condition.column).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {condition.column && renderValueInput(condition)}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeCondition(condition.id)}
                  disabled={conditions.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addCondition}
              disabled={conditions.length >= (config.maxConditions || 5)}
              className="h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Condition
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={applyAdvancedFilter}
              disabled={!conditions.some(c => c.column && (
                c.operator === 'isEmpty' || 
                c.operator === 'isNotEmpty' || 
                c.value
              ))}
              className="h-8"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}