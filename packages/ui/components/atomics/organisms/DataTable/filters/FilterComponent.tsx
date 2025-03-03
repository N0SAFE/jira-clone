import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FilterManager } from './FilterManager';
import { FilterComponentProps, FilterCondition, FilterGroup, LogicOperator, LOGIC_OPERATORS } from './types';
import { Button } from '../../../shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shadcn/select';
import { PlusCircle, XCircle, Filter, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../../../shadcn/badge';
import { Input } from '../../../shadcn/input';
import { Card } from '../../../shadcn/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../shadcn/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shadcn/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../shadcn/tooltip';
import { Switch } from '../../../shadcn/switch';
import { Label } from '../../../shadcn/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../shadcn/dialog';
import { renderFilterInput } from './filterInputs';
import { cn } from '../../../../../lib/utils';

export const FilterComponent: React.FC<FilterComponentProps> = ({
  config,
  initialValue,
  onChange,
  className
}) => {
  // Create filter manager instance
  const filterManager = useMemo(() => 
    new FilterManager(config, initialValue), 
    [config, initialValue]
  );
  
  // State
  const [filterState, setFilterState] = useState<FilterGroup>(filterManager.getState());
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'basic' | 'advanced'>(
    config.defaultMode || (config.enableAdvancedFilter ? 'advanced' : 'basic')
  );
  
  // Count active conditions
  const activeConditionsCount = useMemo(() => 
    filterManager.getActiveConditionsCount(),
    [filterState]
  );
  
  // Update filter state when it changes externally
  useEffect(() => {
    if (initialValue) {
      filterManager.setState(initialValue);
      setFilterState(filterManager.getState());
    }
  }, [initialValue]);
  
  // Notify parent component when filter state changes
  useEffect(() => {
    onChange?.(filterState);
  }, [filterState, onChange]);
  
  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    setFilterState({...filterManager.getState()});
  }, [filterManager]);
  
  // Add a new condition
  const addCondition = useCallback((groupId: string, field: string) => {
    filterManager.addCondition(groupId, field);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Update a condition
  const updateCondition = useCallback((conditionId: string, updates: Partial<FilterCondition>) => {
    filterManager.updateCondition(conditionId, updates);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Remove a condition
  const removeCondition = useCallback((conditionId: string) => {
    filterManager.removeCondition(conditionId);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Add a group
  const addGroup = useCallback((parentGroupId: string, logicOperator?: LogicOperator) => {
    filterManager.addGroup(parentGroupId, logicOperator);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Update a group
  const updateGroup = useCallback((groupId: string, updates: Partial<FilterGroup>) => {
    filterManager.updateGroup(groupId, updates);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Remove a group
  const removeGroup = useCallback((groupId: string) => {
    filterManager.removeGroup(groupId);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Toggle condition active state
  const toggleConditionActive = useCallback((conditionId: string) => {
    filterManager.toggleConditionActive(conditionId);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Toggle group active state
  const toggleGroupActive = useCallback((groupId: string) => {
    filterManager.toggleGroupActive(groupId);
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    filterManager.reset();
    handleFilterChange();
  }, [filterManager, handleFilterChange]);
  
  // Render a filter condition
  const renderCondition = useCallback((condition: FilterCondition, groupId: string) => {
    const filterConfig = config.filters.find(f => f.id === condition.field);
    if (!filterConfig) return null;
    
    const operators = filterManager.getOperatorsForField(condition.field);
    
    return (
      <div 
        key={condition.id} 
        className={cn(
          "flex flex-wrap items-center gap-2 p-2 rounded-md border",
          condition.active === false ? "opacity-60 bg-muted" : "bg-card"
        )}
      >
        {/* Field selector */}
        <Select
          value={condition.field}
          onValueChange={(value) => updateCondition(condition.id, { field: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select field" />
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
          onValueChange={(value) => updateCondition(condition.id, { operator: value })}
        >
          <SelectTrigger className="w-[160px]">
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
        {renderFilterInput({
          filterId: condition.field,
          operator: condition.operator,
          value: condition.value,
          onChange: (id, value) => updateCondition(condition.id, { value }),
          config: filterConfig,
          context: { ...config.context, ...filterConfig.context }
        })}
        
        {/* Actions */}
        <div className="flex items-center ml-auto gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch 
                  checked={condition.active !== false} 
                  onCheckedChange={() => toggleConditionActive(condition.id)} 
                  size="sm"
                />
              </TooltipTrigger>
              <TooltipContent>
                {condition.active !== false ? 'Disable filter' : 'Enable filter'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeCondition(condition.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove filter</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }, [config, updateCondition, toggleConditionActive, removeCondition, filterManager]);
  
  // Render filter group
  const renderGroup = useCallback((group: FilterGroup, level = 0, isRoot = false) => {
    return (
      <div 
        key={group.id} 
        className={cn(
          "border rounded-md p-3 space-y-3",
          level > 0 ? "ml-4" : "",
          group.active === false ? "opacity-60 bg-muted" : "",
          isRoot ? "border-dashed" : ""
        )}
      >
        {/* Group header */}
        {!isRoot && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select
                value={group.logicOperator}
                onValueChange={(value) => updateGroup(group.id, { logicOperator: value as LogicOperator })}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LOGIC_OPERATORS.AND}>AND</SelectItem>
                  <SelectItem value={LOGIC_OPERATORS.OR}>OR</SelectItem>
                </SelectContent>
              </Select>
              
              <span className="text-sm font-medium">
                Group {level}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch 
                      checked={group.active !== false} 
                      onCheckedChange={() => toggleGroupActive(group.id)} 
                      size="sm"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {group.active !== false ? 'Disable group' : 'Enable group'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {level > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove group</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}
        
        {/* Conditions */}
        {group.conditions && group.conditions.length > 0 && (
          <div className="space-y-2">
            {group.conditions.map(condition => renderCondition(condition, group.id))}
          </div>
        )}
        
        {/* Subgroups */}
        {group.groups && group.groups.length > 0 && (
          <div className="space-y-3 mt-3">
            {group.groups.map(subgroup => renderGroup(subgroup, level + 1))}
          </div>
        )}
        
        {/* Group actions */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Select
            onValueChange={(value) => addCondition(group.id, value)}
          >
            <SelectTrigger className="w-[180px]">
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Add filter</span>
            </SelectTrigger>
            <SelectContent>
              {config.filters.map(filter => (
                <SelectItem key={filter.id} value={filter.id}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {config.enableAdvancedFilter && mode === 'advanced' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addGroup(group.id)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add group
            </Button>
          )}
        </div>
      </div>
    );
  }, [
    addCondition, 
    addGroup, 
    updateGroup, 
    removeGroup, 
    toggleGroupActive, 
    renderCondition, 
    config.filters, 
    config.enableAdvancedFilter, 
    mode
  ]);
  
  return (
    <div className={cn("relative", className)}>
      {/* Filter button */}
      <div className="flex items-center gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeConditionsCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeConditionsCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Filter Data</DialogTitle>
              <DialogDescription>
                Configure filters to narrow down the displayed data.
              </DialogDescription>
            </DialogHeader>
            
            {config.enableAdvancedFilter && (
              <Tabs 
                value={mode} 
                onValueChange={(value) => setMode(value as 'basic' | 'advanced')}
                className="mb-4"
              >
                <TabsList>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            {mode === 'basic' ? (
              // Basic filtering mode
              <div className="space-y-3">
                {filterState.conditions.map(condition => 
                  renderCondition(condition, filterState.id)
                )}
                
                <Select
                  onValueChange={(value) => addCondition(filterState.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <span>Add filter</span>
                  </SelectTrigger>
                  <SelectContent>
                    {config.filters.map(filter => (
                      <SelectItem key={filter.id} value={filter.id}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              // Advanced filtering mode
              <div className="space-y-4">
                <Label>
                  Logic: 
                  <Select
                    value={filterState.logicOperator}
                    onValueChange={(value) => 
                      updateGroup(filterState.id, { logicOperator: value as LogicOperator })
                    }
                  >
                    <SelectTrigger className="w-[80px] ml-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LOGIC_OPERATORS.AND}>AND</SelectItem>
                      <SelectItem value={LOGIC_OPERATORS.OR}>OR</SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
                
                {renderGroup(filterState, 0, true)}
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={resetFilters}
              >
                Reset
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};