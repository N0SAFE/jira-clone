'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Filter, Plus, X } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
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
import { Badge } from '@repo/ui/components/shadcn/badge'
import { cn } from '@repo/ui/lib/utils'
import { useDataTableContext } from './DataTableContext'
import { FilterConfiguration, FilterManagerState } from './filters/types'
import { FilterManager } from './filters/FilterManager'
import { Calendar } from '@repo/ui/components/shadcn/calendar'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

interface DataTableFilterProps {
  config: FilterConfiguration
  initialState?: FilterManagerState
  onFilterChange?: (state: FilterManagerState) => void
}

export function DataTableFilter({ 
  config,
  initialState,
  onFilterChange
}: DataTableFilterProps) {
  const { table } = useDataTableContext(
    'DataTableFilter has to be rendered inside a DataTableProvider'
  )
  
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filterManager] = useState(() => new FilterManager(
    config,
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
            if (!filter.isEmpty) {
              table.getColumn(filter.id)?.setFilterValue(filter.value)
            } else {
              table.getColumn(filter.id)?.setFilterValue(undefined)
            }
          })
          // Clear advanced filter if exists
          if (table.options.meta?.advancedFilter) {
            table.options.meta.advancedFilter = undefined
          }
        }
      }
      
      // Notify parent component
      onFilterChange?.(state)
    }
  ))
  
  // Track filter values for UI display
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  
  // Effect to initialize active filters from initialState
  useEffect(() => {
    if (initialState?.filters) {
      const activeFilterIds = initialState.filters
        .filter(f => f.value && f.value !== '__all__')
        .map(f => f.id)
      
      if (activeFilterIds.length > 0) {
        setActiveFilters(activeFilterIds)
        
        // Initialize filter values
        const values: Record<string, any> = {}
        initialState.filters.forEach(filter => {
          values[filter.id] = filter.value
        })
        setFilterValues(values)
      }
    }
  }, [initialState])

  const handleFilterChange = (columnId: string, value: any) => {
    // Update local state for UI display
    setFilterValues(prev => ({
      ...prev,
      [columnId]: value
    }))
    
    if (value === '__all__') {
      filterManager.clearFilter(columnId)
    } else {
      filterManager.setFilter(columnId, value)
    }
  }

  const addFilter = (columnId: string) => {
    if (!activeFilters.includes(columnId)) {
      setActiveFilters([...activeFilters, columnId])
      
      // Set initial value in local state
      const filterConfig = config.filters.find(f => f.id === columnId)
      const initialValue = filterConfig?.type === 'select' ? '__all__' : ''
      
      setFilterValues(prev => ({
        ...prev,
        [columnId]: initialValue
      }))
    }
  }

  const removeFilter = (columnId: string) => {
    filterManager.clearFilter(columnId)
    setActiveFilters(activeFilters.filter(id => id !== columnId))
    
    // Remove from local state
    setFilterValues(prev => {
      const newValues = { ...prev }
      delete newValues[columnId]
      return newValues
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {activeFilters.map((filterId) => {
          const filterConfig = config.filters.find((f) => f.id === filterId)
          if (!filterConfig) return null
          
          return (
            <div 
              key={filterId}
              className="flex items-center gap-2 bg-secondary p-2 pr-3 rounded-md"
            >
              <span className="text-sm font-medium">{filterConfig.label}:</span>
              {filterConfig.type === 'text' && (
                <Input
                  className="h-8 w-[150px]"
                  placeholder={filterConfig.placeholder || `Filter by ${filterConfig.label}...`}
                  onChange={(e) => handleFilterChange(filterId, e.target.value)}
                  value={filterValues[filterId] || ''}
                />
              )}
              {filterConfig.type === 'select' && (
                <Select
                  onValueChange={(value) => handleFilterChange(filterId, value)}
                  value={filterValues[filterId] || '__all__'}
                >
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder={`Select ${filterConfig.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    {filterConfig.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {filterConfig.type === 'date' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !filterValues[filterId] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterValues[filterId] ? 
                        format(new Date(filterValues[filterId]), "PPP") : 
                        "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterValues[filterId] ? new Date(filterValues[filterId]) : undefined}
                      onSelect={(date) => {
                        const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                        handleFilterChange(filterId, formattedDate);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
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
            onClick={() => {
              filterManager.clearAllFilters()
              setActiveFilters([])
              setFilterValues({})
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {config.enableAdvancedFilter && (
        <AdvancedFilter config={config} filterManager={filterManager} />
      )}
    </div>
  )
}

interface AdvancedFilterProps {
  config: FilterConfiguration
  filterManager: FilterManager
}

function AdvancedFilter({ config, filterManager }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [conditions, setConditions] = useState([
    { id: Date.now().toString(), column: '', operator: 'contains', value: '' }
  ])
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    config.defaultLogicOperator || 'AND'
  )
  const [isActive, setIsActive] = useState(false)

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
          { value: 'between', label: 'Between' },
          { value: 'greaterThan', label: 'Greater Than' },
          { value: 'lessThan', label: 'Less Than' }
        ]
      case 'select':
        return [
          { value: 'equals', label: 'Equals' }
        ]
      case 'multi-select':
        return [
          { value: 'in', label: 'Includes' },
          { value: 'notIn', label: 'Does Not Include' }
        ]
      case 'boolean':
        return [
          { value: 'equals', label: 'Equals' }
        ]
      default:
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'startsWith', label: 'Starts With' },
          { value: 'endsWith', label: 'Ends With' }
        ]
    }
  }
  
  const getOperatorLabel = (op: string): string => {
    const operatorMap: Record<string, string> = {
      'contains': 'Contains',
      'equals': 'Equals',
      'startsWith': 'Starts With',
      'endsWith': 'Ends With',
      'between': 'Between',
      'in': 'Includes',
      'notIn': 'Does Not Include',
      'greaterThan': 'Greater Than',
      'lessThan': 'Less Than'
    }
    return operatorMap[op] || op
  }

  const handleColumnChange = (id: string, value: string) => {
    setConditions(conditions.map((c) => {
      if (c.id === id) {
        // When column changes, reset the operator to an appropriate default
        const filterConfig = getFilterConfig(value)
        let defaultOperator = 'contains'
        
        if (filterConfig) {
          defaultOperator = filterConfig.defaultOperator || 
            (filterConfig.type === 'select' ? 'equals' : 
              filterConfig.type === 'multi-select' ? 'in' : 'contains')
        }
        
        return { 
          ...c, 
          column: value,
          operator: defaultOperator,
          value: '' // Reset the value when column changes
        }
      }
      return c
    }))
  }

  const handleOperatorChange = (id: string, value: string) => {
    setConditions(conditions.map((c) => 
      c.id === id ? { ...c, operator: value } : c
    ))
  }

  const handleValueChange = (id: string, value: any) => {
    setConditions(conditions.map((c) => 
      c.id === id ? { ...c, value } : c
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
    filterManager.setAdvancedFilter({
      conditions: conditions.map(c => ({
        id: c.column,
        operator: c.operator,
        value: c.value
      })),
      logicOperator
    })
    
    setIsOpen(false)
    setIsActive(true)
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
  const renderValueInput = (condition: { id: string; column: string; operator: string; value: any }) => {
    const filterConfig = getFilterConfig(condition.column)
    if (!filterConfig) return null

    switch (filterConfig.type) {
      case 'select':
        return (
          <Select
            value={condition.value || ''}
            onValueChange={(value) => handleValueChange(condition.id, value)}
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder={`Select ${filterConfig.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filterConfig.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'multi-select':
        // For simplicity, we'll use a comma-separated string for multi-select in advanced filter
        return (
          <Input
            className="h-8"
            placeholder={`Values (comma separated)`}
            value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value || ''}
            onChange={(e) => handleValueChange(condition.id, e.target.value.split(',').map(v => v.trim()))}
          />
        )
      
      case 'date':
        if (condition.operator === 'between') {
          return (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !Array.isArray(condition.value) || !condition.value[0] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {Array.isArray(condition.value) && condition.value[0] ? 
                        format(new Date(condition.value[0]), "PPP") : 
                        "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={Array.isArray(condition.value) && condition.value[0] ? 
                        new Date(condition.value[0]) : undefined}
                      onSelect={(date) => {
                        const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                        const newValue = Array.isArray(condition.value) 
                          ? [formattedDate, condition.value[1]] 
                          : [formattedDate, ''];
                        handleValueChange(condition.id, newValue);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !Array.isArray(condition.value) || !condition.value[1] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {Array.isArray(condition.value) && condition.value[1] ? 
                        format(new Date(condition.value[1]), "PPP") : 
                        "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={Array.isArray(condition.value) && condition.value[1] ? 
                        new Date(condition.value[1]) : undefined}
                      onSelect={(date) => {
                        const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                        const newValue = Array.isArray(condition.value) 
                          ? [condition.value[0], formattedDate] 
                          : ['', formattedDate];
                        handleValueChange(condition.id, newValue);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )
        } else {
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !condition.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {condition.value ? format(new Date(condition.value), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={condition.value ? new Date(condition.value) : undefined}
                  onSelect={(date) => {
                    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                    handleValueChange(condition.id, formattedDate);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )
        }
      
      case 'number':
        if (condition.operator === 'between') {
          return (
            <div className="flex gap-2 w-full">
              <Input
                type="number"
                className="h-8"
                value={Array.isArray(condition.value) ? condition.value[0] || '' : ''}
                onChange={(e) => {
                  const newValue = Array.isArray(condition.value) 
                    ? [e.target.value, condition.value[1]] 
                    : [e.target.value, '']
                  handleValueChange(condition.id, newValue)
                }}
                placeholder="Min"
              />
              <Input
                type="number"
                className="h-8"
                value={Array.isArray(condition.value) ? condition.value[1] || '' : ''}
                onChange={(e) => {
                  const newValue = Array.isArray(condition.value) 
                    ? [condition.value[0], e.target.value] 
                    : ['', e.target.value]
                  handleValueChange(condition.id, newValue)
                }}
                placeholder="Max"
              />
            </div>
          )
        } else {
          return (
            <Input
              type="number"
              className="h-8"
              value={condition.value || ''}
              onChange={(e) => handleValueChange(condition.id, e.target.value)}
            />
          )
        }
      
      case 'boolean':
        return (
          <Select
            value={condition.value?.toString() || ''}
            onValueChange={(value) => handleValueChange(condition.id, value === 'true')}
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )
      
      // Default text input for all other cases
      default:
        return (
          <Input
            className="h-8 flex-grow"
            placeholder={filterConfig.placeholder || "Value"}
            value={condition.value || ''}
            onChange={(e) => handleValueChange(condition.id, e.target.value)}
          />
        )
    }
  }

  return (
    <div className="mt-2">
      {isActive && (
        <div className="flex items-center mb-2">
          <Badge variant="outline" className="px-3 py-1 font-normal">
            Advanced Filter ({logicOperator}): {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-2"
              onClick={clearAdvancedFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-8 gap-1",
              isActive && "border-primary"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Advanced Filter</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-4" align="start">
          <div className="space-y-4">
            <div className="font-medium">Advanced Filter</div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">Match</span>
              <Select 
                value={logicOperator}
                onValueChange={(value) => setLogicOperator(value as 'AND' | 'OR')}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm">of the following conditions</span>
            </div>
            
            <div className="space-y-3">
              {conditions.map((condition) => (
                <div key={condition.id} className="flex items-center gap-2 flex-wrap">
                  <Select 
                    value={condition.column || ''} 
                    onValueChange={(value) => handleColumnChange(condition.id, value)}
                  >
                    <SelectTrigger className="h-8 w-[150px]">
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
                      value={condition.operator || ''}
                      onValueChange={(value) => handleOperatorChange(condition.id, value)}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Operator" />
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
                  
                  {condition.column && condition.operator && (
                    <div className="flex-grow">
                      {renderValueInput(condition)}
                    </div>
                  )}
                  
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
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={addCondition}
              disabled={conditions.length >= (config.maxConditions || 5)}
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Add condition
            </Button>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={applyAdvancedFilter}
                disabled={conditions.some(c => !c.column || (c.value === '' && c.value !== false))}
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}