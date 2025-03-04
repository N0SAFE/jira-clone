import { 
  FilterState, 
  AdvancedFilterState, 
  FilterGroup, 
  FilterCondition, 
  LogicOperator
} from './types';

// Define type for the resulting Directus filter format
export type DirectusFilterRule = Record<string, any>;

// Define type for operator mapping
export interface OperatorMapping {
  [key: string]: string;
}

// Define type for value transformer
export type ValueTransformer = (
  value: any, 
  operator: string, 
  field: string
) => any;

// Define custom parser options
export interface ParseFilterOptions {
  operatorMapping?: OperatorMapping;
  valueTransformer?: ValueTransformer;
  fieldTransformer?: (field: string) => string;
  relationSeparator?: string;
}

// Default DirectusOperator mapping
const DEFAULT_OPERATOR_MAPPING: OperatorMapping = {
  'equals': '_eq',
  'not_equals': '_neq',
  'contains': '_contains',
  'starts_with': '_starts_with',
  'ends_with': '_ends_with',
  'greater_than': '_gt',
  'less_than': '_lt',
  'greater_than_or_equal': '_gte',
  'less_than_or_equal': '_lte',
  'between': '_between',
  'in': '_in',
  'not_in': '_nin',
  'is_empty': '_null',
  'is_not_empty': '_nnull',
  'custom': '_custom'
};

/**
 * Parse a single condition into a Directus filter rule
 */
function parseCondition(
  condition: FilterCondition, 
  options: ParseFilterOptions
): DirectusFilterRule {
  // Skip inactive conditions
  if (condition.active === false) {
    return {};
  }

  const { 
    operatorMapping = DEFAULT_OPERATOR_MAPPING, 
    valueTransformer, 
    fieldTransformer,
    relationSeparator = '.'
  } = options;

  // Transform field if a field transformer is provided
  const field = fieldTransformer ? fieldTransformer(condition.field) : condition.field;

  // Map the operator to Directus format
  const operator = operatorMapping[condition.operator] || `_${condition.operator}`;

  // Transform the value if a transformer is provided
  const value = valueTransformer 
    ? valueTransformer(condition.value, condition.operator, condition.field)
    : condition.value;
  
  // Handle relational fields (fields with dots like author.name)
  if (field.includes(relationSeparator)) {
    const parts = field.split(relationSeparator);
    const lastPart = parts.pop() || '';
    
    // Recursively build the nested structure
    let result: DirectusFilterRule = { 
      [lastPart]: { [operator]: value } 
    };
    
    // Build from the deepest level up
    for (let i = parts.length - 1; i >= 0; i--) {
      result = { [parts[i]]: result };
    }
    
    return result;
  }

  // Simple field
  return { 
    [field]: { [operator]: value } 
  };
}

/**
 * Parse a filter group into a Directus filter rule
 */
function parseGroup(
  group: FilterGroup, 
  options: ParseFilterOptions
): DirectusFilterRule {
  // Skip inactive groups
  if (group.active === false) {
    return {};
  }

  // Parse all active conditions in this group
  const conditionRules = group.conditions
    .filter(condition => condition.active !== false)
    .map(condition => parseCondition(condition, options));

  // Parse all active subgroups
  const subgroupRules = group.groups
    ? group.groups
        .filter(subgroup => subgroup.active !== false)
        .map(subgroup => parseGroup(subgroup, options))
    : [];

  // Combine all rules
  const allRules = [...conditionRules, ...subgroupRules].filter(rule => 
    Object.keys(rule).length > 0
  );

  if (allRules.length === 0) {
    return {};
  }

  // If only one rule, return it directly (without logical operator)
  if (allRules.length === 1) {
    return allRules[0];
  }

  // Convert logic operator to Directus format
  const logicOp = group.logicOperator === 'AND' ? '_and' : '_or';

  return {
    [logicOp]: allRules
  };
}

/**
 * Parse basic filter states into a Directus filter rule
 */
function parseBasicFilters(
  filters: FilterState[],
  options: ParseFilterOptions
): DirectusFilterRule {
  if (!filters || filters.length === 0) {
    return {};
  }

  // Convert basic filters to conditions
  const conditions: FilterCondition[] = filters.map(filter => ({
    id: filter.id,
    field: filter.id,
    operator: filter.operator,
    value: filter.value,
    active: true
  }));

  // Create a virtual group with AND logic
  const group: FilterGroup = {
    id: 'root',
    logicOperator: 'AND',
    conditions,
    active: true
  };

  return parseGroup(group, options);
}

/**
 * Parse advanced filter state into a Directus filter rule
 */
function parseAdvancedFilter(
  advancedFilter: AdvancedFilterState,
  options: ParseFilterOptions
): DirectusFilterRule {
  if (!advancedFilter) {
    return {};
  }

  // If advancedFilter is already in FilterGroup format
  if (advancedFilter.logicOperator && Array.isArray(advancedFilter.conditions)) {
    return parseGroup(advancedFilter as FilterGroup, options);
  }

  // Otherwise, construct a FilterGroup
  const group: FilterGroup = {
    id: 'root',
    logicOperator: advancedFilter.logicOperator || 'AND',
    conditions: advancedFilter.conditions?.map((condition: any) => ({
      id: condition.id || condition.field,
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
      active: condition.active !== false
    })) || [],
    active: true
  };

  return parseGroup(group, options);
}

/**
 * Parse filter manager state into a Directus filter rule
 */
export function parseFilterToDirectus(
  state: { filters?: FilterState[], advancedFilter?: AdvancedFilterState, rootGroup?: FilterGroup },
  options: ParseFilterOptions = {}
): DirectusFilterRule {
  // Handle root group if provided
  if (state.rootGroup && Object.keys(state.rootGroup).length > 0) {
    return parseGroup(state.rootGroup, options);
  }

  // Handle advanced filter if provided
  if (state.advancedFilter) {
    return parseAdvancedFilter(state.advancedFilter, options);
  }

  // Fall back to parsing basic filters
  if (state.filters && state.filters.length > 0) {
    return parseBasicFilters(state.filters, options);
  }

  return {};
}

/**
 * Parse a single filter state into a Directus filter rule
 */
export function parseFilterState(
  filter: FilterState,
  options: ParseFilterOptions = {}
): DirectusFilterRule {
  const condition: FilterCondition = {
    id: filter.id,
    field: filter.id,
    operator: filter.operator,
    value: filter.value,
    active: true
  };
  
  return parseCondition(condition, options);
}