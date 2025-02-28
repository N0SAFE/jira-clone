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
import { getFilterInputComponent } from './FilterInputs'
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

  const getFilterConfig = (columnId: string) => {
    return config.filters.find(f => f.id === columnId)
  }

  const getOperatorLabel = (operator: string): string => {
    switch(operator) {
      case 'contains': return 'Contains'
      case 'equals': return 'Equals'
      case 'startsWith': return 'Starts with'
      case 'endsWith': return 'Ends with'
      case 'between': return 'Between'
      case 'in': return 'In'
      case 'notIn': return 'Not in'
      default: return operator
    }
  }

  const getOperatorsForColumn = (columnId: string): Array<{value: string, label: string}> => {
    const filterConfig = getFilterConfig(columnId)
    
    // If we have defined operators in the config, use those
    if (filterConfig?.operators?.length) {
      return filterConfig.operators.map(op => ({
        value: op,
        label: getOperatorLabel(op)
      }))
    }
    
    // Otherwise provide defaults based on type
    switch (filterConfig?.type) {
      case 'date':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'between', label: 'Between' }
        ]
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'between', label: 'Between' }
        ]
      case 'select':
        return [
          { value: 'equals', label: 'Equals' }
        ]
      case 'multi-select':
        return [
          { value: 'in', label: 'In' },
          { value: 'notIn', label: 'Not in' }
        ]
      default:
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' }
        ]
    }
  }

  const handleColumnChange = (conditionId: string, columnId: string) => {
    setConditions(conditions.map((c) => {
      if (c.id === conditionId) {
        const filterConfig = getFilterConfig(columnId)
        // Reset operator to default for this type
        const operators = getOperatorsForColumn(columnId)
        const defaultOperator = operators.length > 0 ? operators[0].value : 'contains'
        
        return { 
          ...c, 
          column: columnId,
          operator: defaultOperator,
          value: '' // Reset value too
        }
      }
      return c
    }))
  }

  const handleOperatorChange = (conditionId: string, operator: string) => {
    setConditions(conditions.map((c) => 
      c.id === conditionId ? { ...c, operator } : c
    ))
  }

  const handleValueChange = (conditionId: string, value: string) => {
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
    const filteredConditions = conditions.filter(c => c.column && c.value)
    
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

  // Function to render the appropriate input based on filter type
  const renderValueInput = (condition: FilterCondition) => {
    const filterConfig = getFilterConfig(condition.column)
    if (!filterConfig) {
      return null;
    }

    // Use our component factory to get the right input component
    const InputComponent = getFilterInputComponent(filterConfig.type)
    
    // If we have a custom component for this filter type
    if (InputComponent) {
      return (
        <InputComponent
          filterId={condition.id}
          config={filterConfig}
          value={condition.value}
          onChange={(_, value) => handleValueChange(condition.id, value)}
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
            Edit Advanced Filter ({conditions.filter(c => c.column && c.value).length} conditions)
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
              <div key={condition.id} className="flex items-center gap-2">
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
              disabled={!conditions.some(c => c.column && c.value)}
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