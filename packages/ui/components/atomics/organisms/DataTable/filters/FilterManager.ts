import type { OperatorDefinition } from './types';
import {
  FilterCondition,
  FilterGroup,
  LogicOperator,
  FilterConfiguration,
  FilterOperator,
  LOGIC_OPERATORS,
  OperatorConfig,
  FilterConfig,
  FilterSystem as IFilterSystem,
  AdvancedFilterState,
  FilterState,
  FilterManagerState
} from './types';
import { OperatorManager } from './OperatorManager';
import { DEFAULT_FILTER_SYSTEM_CONFIG } from './defaultFilterConfig';
import { FilterSystem } from './FilterSystem';

// Simple ID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export class FilterManager {
  private config: FilterConfiguration;
  private rootGroup: FilterGroup = this.createEmptyGroup('AND');
  private operatorManager: OperatorManager;
  private filterSystem: FilterSystem;
  private advancedFilter?: AdvancedFilterState;
  private basicFilters: FilterState[] = [];
  private onStateChange?: (state: FilterManagerState) => void;
  private previousState?: FilterManagerState;

  constructor(
    config: FilterConfiguration,
    state?: FilterManagerState,
    onStateChange?: (state: FilterManagerState) => void
  ) {
    this.config = config;
    this.onStateChange = onStateChange;
    
    // Initialize operator manager with correct types
    const operatorConfig = this.config.operatorConfig || 
      (this.config.systemConfig ? {
        operators: Object.entries(this.config.systemConfig.operators).reduce((acc, [key, op]) => ({
          ...acc,
          [key]: { ...op, value: op.id }
        }), {})
      } : undefined);
    
    this.operatorManager = new OperatorManager(operatorConfig);
    this.filterSystem = new FilterSystem(this.config.systemConfig);
    
    // Initialize state
    const initialState = state || {
      filters: [],
      advancedFilter: undefined,
      rootGroup: this.createEmptyGroup(this.config.defaultLogicOperator || 'AND')
    };
    
    this.setFilterState(initialState);
    this.previousState = this.getState();
  }

  /**
   * Get the current filter state
   */
  getState(): FilterManagerState {
    return {
      rootGroup: this.rootGroup,
      filters: this.basicFilters,
      advancedFilter: this.advancedFilter,
    };
  }

  /**
   * Set the complete filter state
   */
  setFilterState(state: FilterManagerState): void {
    if (state.advancedFilter) {
      this.advancedFilter = state.advancedFilter;
      this.basicFilters = []; // Clear basic filters when setting advanced filter
    } else if (state.filters) {
      this.basicFilters = state.filters;
      this.advancedFilter = undefined; // Clear advanced filter when setting basic filters
    }

    // Set root group if provided
    if (state.rootGroup) {
      this.rootGroup = this.validateGroup(state.rootGroup);
    } else {
      this.rootGroup = this.createEmptyGroup(this.config.defaultLogicOperator || 'AND');
    }

    this._notifyStateChange();
  }

  /**
   * Get the filter system configuration
   */
  getFilterSystem(): FilterSystem {
    return this.filterSystem;
  }

  /**
   * Get filter config by ID
   */
  getFilterConfig(filterId: string): FilterConfig | undefined {
    return this.config.filters.find(filter => filter.id === filterId);
  }

  /**
   * Create a new empty filter group
   */
  createEmptyGroup(logicOperator: LogicOperator = 'AND'): FilterGroup {
    return {
      id: generateId(),
      logicOperator,
      conditions: [],
      groups: [],
      active: true
    };
  }

  /**
   * Set advanced filter
   */
  setAdvancedFilter(filter: AdvancedFilterState): void {
    const shouldUpdate = !this.advancedFilter || 
      JSON.stringify(this.advancedFilter) !== JSON.stringify(filter);
    
    if (shouldUpdate) {
      this.advancedFilter = filter;
      this.basicFilters = []; // Clear basic filters when setting advanced filter
      this._notifyStateChange();
    }
  }
  
  /**
   * Clear advanced filter
   */
  clearAdvancedFilter(): void {
    this.advancedFilter = undefined;
    this._notifyStateChange();
  }
  
  /**
   * Set a basic filter
   */
  setFilter(filterId: string, value: any): void {
    // Find existing filter
    const existingFilterIndex = this.basicFilters.findIndex(f => f.id === filterId);
    
    if (existingFilterIndex >= 0) {
      // Skip update if value hasn't changed
      if (JSON.stringify(this.basicFilters[existingFilterIndex].value) === JSON.stringify(value)) {
        return;
      }
      
      // Update existing filter
      const updatedFilters = [...this.basicFilters];
      updatedFilters[existingFilterIndex] = {
        ...updatedFilters[existingFilterIndex],
        value
      };
      this.basicFilters = updatedFilters;
    } else {
      // Add new filter
      const filterConfig = this.getFilterConfig(filterId);
      const defaultOperator = filterConfig?.defaultOperator || 'equals';
      
      this.basicFilters = [
        ...this.basicFilters,
        {
          id: filterId,
          value,
          operator: defaultOperator
        }
      ];
    }
    
    // Clear advanced filter when setting basic filters
    this.advancedFilter = undefined;
    
    this._notifyStateChange();
  }
  
  /**
   * Set a filter operator
   */
  setFilterOperator(filterId: string, operator: string): void {
    // Find existing filter
    const existingFilterIndex = this.basicFilters.findIndex(f => f.id === filterId);
    
    if (existingFilterIndex >= 0) {
      // Update existing filter
      const updatedFilters = [...this.basicFilters];
      updatedFilters[existingFilterIndex] = {
        ...updatedFilters[existingFilterIndex],
        operator
      };
      this.basicFilters = updatedFilters;
      
      this._notifyStateChange();
    }
  }

  /**
   * Add a new condition to a group
   */
  addCondition(groupId: string, field: string): FilterCondition | null {
    // Find the filter configuration
    const filterConfig = this.config.filters.find(f => f.id === field);
    if (!filterConfig) return null;

    // Determine the default operator and value
    const defaultOperator = filterConfig.defaultOperator || 
      this.getDefaultOperatorForType(filterConfig.filterType);
    
    const defaultValue = filterConfig.defaultValue !== undefined ? 
      filterConfig.defaultValue : null;

    // Create the condition
    const condition: FilterCondition = {
      id: generateId(),
      field,
      operator: defaultOperator,
      value: defaultValue,
      active: true
    };

    // Find the group and add the condition
    const updatedRoot = this.updateGroupRecursive(this.rootGroup, groupId, group => ({
      ...group,
      conditions: [...group.conditions, condition]
    }));

    if (updatedRoot) {
      this.rootGroup = updatedRoot;
      this._notifyStateChange();
      return condition;
    }

    return null;
  }

  /**
   * Update a condition
   */
  updateCondition(conditionId: string, updates: Partial<FilterCondition>): boolean {
    let found = false;

    const updatedRoot = this.updateGroupRecursive(this.rootGroup, null, group => {
      const updatedConditions = group.conditions.map(condition => {
        if (condition.id === conditionId) {
          found = true;
          return { ...condition, ...updates };
        }
        return condition;
      });

      return {
        ...group,
        conditions: updatedConditions
      };
    });

    if (found && updatedRoot) {
      this.rootGroup = updatedRoot;
      return true;
    }

    return false;
  }

  /**
   * Remove a condition
   */
  removeCondition(conditionId: string): boolean {
    let found = false;

    const updatedRoot = this.updateGroupRecursive(this.rootGroup, null, group => {
      const updatedConditions = group.conditions.filter(condition => {
        if (condition.id === conditionId) {
          found = true;
          return false;
        }
        return true;
      });

      return {
        ...group,
        conditions: updatedConditions
      };
    });

    if (found && updatedRoot) {
      this.rootGroup = updatedRoot;
      return true;
    }

    return false;
  }

  /**
   * Add a new subgroup to a parent group
   */
  addGroup(parentGroupId: string, logicOperator?: LogicOperator): FilterGroup | null {
    const newGroup = this.createEmptyGroup(logicOperator || this.config.defaultLogicOperator || 'AND');

    const updatedRoot = this.updateGroupRecursive(this.rootGroup, parentGroupId, group => ({
      ...group,
      groups: [...(group.groups || []), newGroup]
    }));

    if (updatedRoot) {
      this.rootGroup = updatedRoot;
      return newGroup;
    }

    return null;
  }

  /**
   * Update a group
   */
  updateGroup(groupId: string, updates: Partial<FilterGroup>): boolean {
    if (groupId === this.rootGroup.id) {
      this.rootGroup = { ...this.rootGroup, ...updates };
      return true;
    }

    const updatedRoot = this.updateGroupRecursive(this.rootGroup, groupId, group => ({
      ...group,
      ...updates
    }));

    if (updatedRoot) {
      this.rootGroup = updatedRoot;
      return true;
    }

    return false;
  }

  /**
   * Remove a group
   */
  removeGroup(groupId: string): boolean {
    if (groupId === this.rootGroup.id) {
      // Can't remove root group
      return false;
    }

    let found = false;

    const updatedRoot = this.updateGroupRecursive(this.rootGroup, null, group => {
      if (!group.groups) return group;

      const updatedGroups = group.groups.filter(subgroup => {
        if (subgroup.id === groupId) {
          found = true;
          return false;
        }
        return true;
      });

      return {
        ...group,
        groups: updatedGroups
      };
    });

    if (found && updatedRoot) {
      this.rootGroup = updatedRoot;
      return true;
    }

    return false;
  }

  /**
   * Toggle the active state of a condition
   */
  toggleConditionActive(conditionId: string): boolean {
    return this.updateCondition(conditionId, {
      active: !this.findCondition(conditionId)?.active
    });
  }

  /**
   * Toggle the active state of a group
   */
  toggleGroupActive(groupId: string): boolean {
    const group = this.findGroup(groupId);
    if (!group) return false;

    return this.updateGroup(groupId, {
      active: !group.active
    });
  }

  /**
   * Check if a row matches the filter criteria
   */
  evaluateRow(row: any): boolean {
    return this.evaluateGroup(this.rootGroup, row);
  }

  /**
   * Get all the available operators for a specific filter
   */
  getOperatorsForField(field: string): { value: string, label: string }[] {
    const filterConfig = this.config.filters.find(f => f.id === field);
    if (!filterConfig) return [];

    // Check if the filter has specific operators defined
    if (filterConfig.availableOperators && filterConfig.availableOperators.length > 0) {
      return filterConfig.availableOperators.map(opId => {
        const op = this.operatorManager.getOperator(opId);
        return op ? { value: op.id, label: op.label } : { value: opId, label: opId };
      });
    }

    // Otherwise get operators based on the filter type
    return this.operatorManager.getOperatorsForType(filterConfig.filterType)
      .map(op => ({ value: op.id, label: op.label }));
  }

  /**
   * Get count of active conditions
   */
  getActiveConditionsCount(): number {
    let count = 0;
    
    const countInGroup = (group: FilterGroup): number => {
      let groupCount = 0;
      
      // Count conditions in this group
      if (group.active !== false) {
        groupCount += group.conditions.filter(c => c.active !== false).length;
        
        // Count conditions in subgroups
        if (group.groups && group.groups.length > 0) {
          groupCount += group.groups.reduce((acc, g) => acc + countInGroup(g), 0);
        }
      }
      
      return groupCount;
    };
    
    count = countInGroup(this.rootGroup);
    return count;
  }

  /**
   * Reset all filters
   */
  reset(): void {
    this.rootGroup = this.createEmptyGroup(this.config.defaultLogicOperator || 'AND');
    this.advancedFilter = undefined;
    this.basicFilters = [];
    this._notifyStateChange();
  }

  /**
   * Notify state change to listeners
   */
  private _notifyStateChange(): void {
    if (!this.onStateChange) return;

    const currentState = this.getState();
    
    // Skip if state hasn't changed meaningfully
    if (this.previousState && 
        JSON.stringify(this.previousState) === JSON.stringify(currentState)) {
      return;
    }

    this.previousState = currentState;
    this.onStateChange(currentState);
  }

  // Private helper methods

  /**
   * Evaluate if a group's conditions match a row
   */
  private evaluateGroup(group: FilterGroup, row: any): boolean {
    // If group is not active, it doesn't affect the result
    if (group.active === false) return true;
    
    // Get results from all conditions in this group
    const conditionResults = group.conditions
      .filter(condition => condition.active !== false)
      .map(condition => this.evaluateCondition(condition, row));

    // Get results from all subgroups
    const subgroupResults = (group.groups || [])
      .filter(subgroup => subgroup.active !== false)
      .map(subgroup => this.evaluateGroup(subgroup, row));
    
    // Combine all results based on the logic operator
    const allResults = [...conditionResults, ...subgroupResults];
    
    if (allResults.length === 0) return true;
    
    if (group.logicOperator === LOGIC_OPERATORS.OR) {
      return allResults.some(result => result === true);
    } else {
      return allResults.every(result => result === true);
    }
  }

  /**
   * Evaluate if a condition matches a row
   */
  private evaluateCondition(condition: FilterCondition, row: any): boolean {
    const { field, operator, value } = condition;
    
    // If the field doesn't exist in the row, the condition doesn't match
    if (!(field in row)) return false;
    
    // Get the target value from the row
    const targetValue = row[field];
    
    // Find the filter config for this field
    const filterConfig = this.config.filters.find(f => f.id === field);
    
    // Evaluate using the operator manager
    return this.operatorManager.evaluateOperator(
      operator, 
      targetValue, 
      value,
      filterConfig
    );
  }

  /**
   * Update a group recursively
   */
  private updateGroupRecursive(
    group: FilterGroup,
    targetGroupId: string | null,
    updateFn: (group: FilterGroup) => FilterGroup
  ): FilterGroup | null {
    // If we found the target group, update it
    if (targetGroupId === null || group.id === targetGroupId) {
      return updateFn(group);
    }
    
    // Otherwise, look in subgroups
    if (group.groups && group.groups.length > 0) {
      const updatedSubgroups = group.groups.map(subgroup => {
        const updatedSubgroup = this.updateGroupRecursive(subgroup, targetGroupId, updateFn);
        return updatedSubgroup || subgroup;
      });
      
      // If any subgroups were updated, return the updated group
      if (updatedSubgroups.some((subgroup, i) => subgroup !== group.groups?.[i])) {
        return {
          ...group,
          groups: updatedSubgroups
        };
      }
    }
    
    // If we got here, the target group wasn't found
    return null;
  }

  /**
   * Find a condition by ID
   */
  private findCondition(conditionId: string): FilterCondition | null {
    let result: FilterCondition | null = null;
    
    const searchInGroup = (group: FilterGroup) => {
      // Search in this group's conditions
      const condition = group.conditions.find(c => c.id === conditionId);
      if (condition) {
        result = condition;
        return;
      }
      
      // Search in subgroups
      if (group.groups && group.groups.length > 0) {
        group.groups.forEach(searchInGroup);
      }
    };
    
    searchInGroup(this.rootGroup);
    return result;
  }

  /**
   * Find a group by ID
   */
  private findGroup(groupId: string): FilterGroup | null {
    if (this.rootGroup.id === groupId) return this.rootGroup;
    
    let result: FilterGroup | null = null;
    
    const searchInGroup = (group: FilterGroup) => {
      // Search in subgroups
      if (group.groups && group.groups.length > 0) {
        for (const subgroup of group.groups) {
          if (subgroup.id === groupId) {
            result = subgroup;
            return;
          }
          searchInGroup(subgroup);
        }
      }
    };
    
    searchInGroup(this.rootGroup);
    return result;
  }

  /**
   * Get default operator for a filter type
   */
  private getDefaultOperatorForType(type: string): string {
    // Try to get from the system config
    if (this.config.systemConfig?.filterTypes?.[type]) {
      return this.config.systemConfig.filterTypes[type].defaultOperator;
    }
    
    // Fall back to defaults from the default system config
    if (DEFAULT_FILTER_SYSTEM_CONFIG.filterTypes[type]) {
      return DEFAULT_FILTER_SYSTEM_CONFIG.filterTypes[type].defaultOperator;
    }
    
    // Absolute fallback
    return 'equals';
  }

  /**
   * Validate a group structure
   */
  private validateGroup(group: FilterGroup): FilterGroup {
    return {
      ...group,
      id: group.id || generateId(),
      logicOperator: 
        group.logicOperator || 
        this.config.defaultLogicOperator || 
        'AND',
      conditions: group.conditions || [],
      groups: group.groups 
        ? group.groups.map(subgroup => this.validateGroup(subgroup)) 
        : [],
      active: group.active !== false
    };
  }
}