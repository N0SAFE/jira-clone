/** @jsxImportSource react */
'use client'

import React, { useState, useEffect } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Input } from '@repo/ui/components/shadcn/input'
import { Button } from '@repo/ui/components/shadcn/button'
import { Calendar } from '@repo/ui/components/shadcn/calendar'
import { Checkbox } from '@repo/ui/components/shadcn/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/shadcn/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/shadcn/popover'
import { cn } from '@repo/ui/lib/utils'

import { FilterConfig, FilterOperator, FILTER_TYPES, OperatorDefinition } from './types'
import { FilterSystem } from './FilterSystem'

// Base interface for all filter input components
interface FilterInputBaseProps {
  filterId: string
  config: FilterConfig
  value: any
  onChange: (id: string, value: any) => void
  placeholder?: string
  context?: any
}

// Text input component
export function TextFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange, placeholder, context } = props
  
  const [inputValue, setInputValue] = useState(value || '')
  
  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(filterId, newValue)
  }
  
  return (
    <Input
      className="h-8 w-[150px]"
      placeholder={placeholder || config.placeholder || `Filter by ${config.label}...`}
      value={inputValue}
      onChange={handleInputChange}
    />
  )
}

// Select input component
export function SelectFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange, context } = props
  // Use options from context if provided, otherwise from config
  const options = context?.options || config.options || []
  
  // Use effect to handle initial state and updates
  const [selectedValue, setSelectedValue] = useState(value || '__all__')
  
  // Update internal state when external value changes
  useEffect(() => {
    setSelectedValue(value || '__all__')
  }, [value])
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    onChange(filterId, newValue)
  }
  
  return (
    <Select
      value={selectedValue}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="h-8 w-[150px]">
        <SelectValue placeholder={`Select ${config.label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Multi-select input component
export function MultiSelectFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value = [], onChange, context } = props
  // Use options from context if provided, otherwise from config
  const options = context?.options || config.options || []
  const [selectedOptions, setSelectedOptions] = useState<string[]>(Array.isArray(value) ? value : [])
  
  // Update internal state when external value changes
  useEffect(() => {
    setSelectedOptions(Array.isArray(value) ? value : [])
  }, [value])
  
  const handleOptionToggle = (optionValue: string) => {
    let newSelection: string[]
    if (selectedOptions.includes(optionValue)) {
      newSelection = selectedOptions.filter(val => val !== optionValue)
    } else {
      newSelection = [...selectedOptions, optionValue]
    }
    setSelectedOptions(newSelection)
    onChange(filterId, newSelection)
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-8 w-[150px] justify-start truncate"
        >
          {selectedOptions.length === 0 
            ? `Select ${config.label}...` 
            : `${selectedOptions.length} selected`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-1">
              <Checkbox 
                id={`${filterId}-${option.value}`}
                checked={selectedOptions.includes(option.value)}
                onCheckedChange={() => handleOptionToggle(option.value)}
              />
              <label 
                htmlFor={`${filterId}-${option.value}`}
                className="text-sm cursor-pointer flex-grow"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Date input component
export function DateFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange, context } = props
  const dateFormat = context?.dateFormat || "MMM dd, yyyy"
  
  // Parse date from value
  const parseDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined
    
    try {
      if (typeof dateValue === 'string') {
        const parsedDate = parseISO(dateValue)
        return isValid(parsedDate) ? parsedDate : undefined
      }
      return undefined
    } catch (e) {
      console.error("Invalid date format:", dateValue)
      return undefined
    }
  }
  
  // Better handling of the date value
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => parseDate(value))
  
  // Update internal state when external value changes
  useEffect(() => {
    setSelectedDate(parseDate(value))
  }, [value])
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    // Format as ISO string for consistency
    const formattedDate = date ? format(date, "yyyy-MM-dd") : null
    onChange(filterId, formattedDate)
  }
  
  return (
    <div className="relative inline-block">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button" 
            variant="outline"
            className={cn(
              "w-[150px] h-8 px-2 justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? 
              format(selectedDate, dateFormat) : 
              "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Number input component
export function NumberFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange, placeholder, context } = props
  return (
    <Input
      type="number"
      className="h-8 w-[150px]"
      placeholder={placeholder || config.placeholder || `Filter by ${config.label}...`}
      onChange={(e) => {
        const val = e.target.value ? Number(e.target.value) : null
        onChange(filterId, val)
      }}
      value={value ?? ''}
      min={context?.min}
      max={context?.max}
      step={context?.step || 1}
    />
  )
}

// Boolean input component
export function BooleanFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange } = props
  
  const [selectedValue, setSelectedValue] = useState<string>(
    value === true ? 'true' : value === false ? 'false' : '__all__'
  )
  
  // Update internal state when external value changes
  useEffect(() => {
    setSelectedValue(value === true ? 'true' : value === false ? 'false' : '__all__')
  }, [value])
  
  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue)
    if (newValue === 'true') onChange(filterId, true)
    else if (newValue === 'false') onChange(filterId, false)
    else onChange(filterId, null)
  }
  
  return (
    <Select
      value={selectedValue}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="h-8 w-[150px]">
        <SelectValue placeholder="Select value" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All</SelectItem>
        <SelectItem value="true">Yes</SelectItem>
        <SelectItem value="false">No</SelectItem>
      </SelectContent>
    </Select>
  )
}

// Between range input for numbers
export function NumberRangeFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange, context } = props
  const [minValue, maxValue] = Array.isArray(value) ? value : [null, null]
  
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="h-8 w-[70px]"
        placeholder="Min"
        value={minValue ?? ''}
        onChange={(e) => {
          const min = e.target.value ? Number(e.target.value) : null
          onChange(filterId, [min, maxValue])
        }}
        min={context?.min}
        max={context?.max}
        step={context?.step || 1}
      />
      <span className="text-xs">to</span>
      <Input
        type="number"
        className="h-8 w-[70px]"
        placeholder="Max"
        value={maxValue ?? ''}
        onChange={(e) => {
          const max = e.target.value ? Number(e.target.value) : null
          onChange(filterId, [minValue, max])
        }}
        min={context?.min}
        max={context?.max}
        step={context?.step || 1}
      />
    </div>
  )
}

// Date range input
export function DateRangeFilterInput(props: FilterInputBaseProps) {
  const { filterId, config, value, onChange } = props
  const dateFormat = "MMM dd, yyyy"
  
  // Parse date from string
  const parseDate = (dateStr: any): Date | undefined => {
    if (!dateStr) return undefined
    
    try {
      if (typeof dateStr === 'string') {
        const parsedDate = parseISO(dateStr)
        return isValid(parsedDate) ? parsedDate : undefined
      }
      return undefined
    } catch (e) {
      console.error("Invalid date string:", dateStr)
      return undefined
    }
  }
  
  const [startDate, endDate] = Array.isArray(value) ? 
    [parseDate(value[0]), parseDate(value[1])] : 
    [undefined, undefined]
  
  const handleStartDateChange = (date: Date | undefined) => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : null
    onChange(filterId, [formattedDate, Array.isArray(value) ? value[1] : null])
  }
  
  const handleEndDateChange = (date: Date | undefined) => {
    const formattedDate = date ? format(date, "yyyy-MM-dd") : null
    onChange(filterId, [Array.isArray(value) ? value[0] : null, formattedDate])
  }
  
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-[110px] h-8 px-2 justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {startDate ? 
              format(startDate, "MMM d, yy") : 
              "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <span className="text-xs">to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-[110px] h-8 px-2 justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {endDate ? 
              format(endDate, "MMM d, yy") : 
              "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Map of components by filter type
const DEFAULT_FILTER_TYPE_COMPONENTS = {
  [FILTER_TYPES.TEXT]: TextFilterInput,
  [FILTER_TYPES.NUMBER]: NumberFilterInput,
  [FILTER_TYPES.SELECT]: SelectFilterInput,
  [FILTER_TYPES.MULTI_SELECT]: MultiSelectFilterInput,
  [FILTER_TYPES.DATE]: DateFilterInput,
  [FILTER_TYPES.BOOLEAN]: BooleanFilterInput
}

// Map of components by operator
const OPERATOR_COMPONENTS = {
  between: {
    [FILTER_TYPES.NUMBER]: NumberRangeFilterInput,
    [FILTER_TYPES.DATE]: DateRangeFilterInput
  }
}

// Factory function to get the appropriate filter input component based on type and operator
export function getFilterInputComponent(
  filterType: string, 
  operator?: string,
  filterSystem?: FilterSystem
): React.ComponentType<FilterInputBaseProps> {
  // If between operator is used, return range components
  if (operator === 'between' && OPERATOR_COMPONENTS.between[filterType as keyof typeof OPERATOR_COMPONENTS.between]) {
    return OPERATOR_COMPONENTS.between[filterType as keyof typeof OPERATOR_COMPONENTS.between]
  }
  
  // If a custom component is defined for this filter type in the filter system
  if (filterSystem) {
    const filterTypeDef = filterSystem.getFilterType(filterType)
    if (filterTypeDef?.component) {
      return filterTypeDef.component as any
    }

    // If there's a custom component for this specific operator
    if (operator) {
      const operatorDef = filterSystem.getOperator(operator)
      if (operatorDef?.component === 'range') {
        if (filterType === FILTER_TYPES.NUMBER) return NumberRangeFilterInput
        if (filterType === FILTER_TYPES.DATE) return DateRangeFilterInput
      }
    }
  }
  
  // Return default component for this filter type
  return DEFAULT_FILTER_TYPE_COMPONENTS[filterType as keyof typeof DEFAULT_FILTER_TYPE_COMPONENTS] || TextFilterInput
}

// Helper function to get operators for a filter
export function getOperatorsForFilter(
  config: FilterConfig, 
  filterSystem?: FilterSystem
): Array<{value: string, label: string}> {
  // If using the FilterSystem
  if (filterSystem) {
    // If filter has explicitly specified available operators, use those
    if (config.availableOperators) {
      return config.availableOperators.map(opId => {
        const opDef = filterSystem.getOperator(opId)
        return {
          value: opId,
          label: opDef?.label || formatOperatorLabel(opId)
        }
      })
    }
    
    // Otherwise get operators for this filter type from the filter system
    const operators = filterSystem.getOperatorsForFilterType(config.filterType)
    return operators.map(op => ({
      value: op.id,
      label: op.label
    }))
  }
  
  // Fallback if no filter system available
  return getDefaultOperatorsForType(config.filterType)
}

// Get default operators for a filter type (legacy fallback)
function getDefaultOperatorsForType(type: string): Array<{value: string, label: string}> {
  switch (type) {
    case FILTER_TYPES.TEXT:
      return [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' }
      ]
    case FILTER_TYPES.SELECT:
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'isEmpty', label: 'Is empty' }
      ]
    case FILTER_TYPES.MULTI_SELECT:
      return [
        { value: 'in', label: 'In' },
        { value: 'notIn', label: 'Not in' },
        { value: 'isEmpty', label: 'Is empty' }
      ]
    case FILTER_TYPES.DATE:
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'between', label: 'Between' },
        { value: 'greaterThan', label: 'After' },
        { value: 'lessThan', label: 'Before' },
        { value: 'isEmpty', label: 'Is empty' }
      ]
    case FILTER_TYPES.NUMBER:
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'between', label: 'Between' },
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'lessThan', label: 'Less than' },
        { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
        { value: 'lessThanOrEqual', label: 'Less than or equal' },
        { value: 'isEmpty', label: 'Is empty' }
      ]
    case FILTER_TYPES.BOOLEAN:
      return [
        { value: 'equals', label: 'Equals' }
      ]
    case FILTER_TYPES.CUSTOM:
      return [
        { value: 'custom', label: 'Custom' }
      ]
    default:
      return [
        { value: 'contains', label: 'Contains' }
      ]
  }
}

// Helper function to format operator IDs into readable labels
function formatOperatorLabel(operatorId: string): string {
  return operatorId
    .replace(/([A-Z])/g, ' $1') // Insert a space before all uppercase letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize the first letter
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Ensure space between words
}