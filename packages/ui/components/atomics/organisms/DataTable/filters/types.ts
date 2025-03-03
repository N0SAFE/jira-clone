// Available filter operators as constants
export const OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL: 'less_than_or_equal',
  BETWEEN: 'between',
  IN: 'in',
  NOT_IN: 'not_in',
  IS_EMPTY: 'is_empty',
  IS_NOT_EMPTY: 'is_not_empty',
  CUSTOM: 'custom'
} as const;

// Available filter types as constants
export const FILTER_TYPES = {
  TEXT: 'text',
  SELECT: 'select',
  MULTI_SELECT: 'multi-select',
  DATE: 'date',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  CUSTOM: 'custom'
} as const;

// Available logic operators
export const LOGIC_OPERATORS = {
  AND: 'AND',
  OR: 'OR'
} as const;

// Type for filter operators
export type FilterOperator = typeof OPERATORS[keyof typeof OPERATORS] | string;

// Type for filter types
export type FilterType = typeof FILTER_TYPES[keyof typeof FILTER_TYPES] | string;

// Type for logic operators
export type LogicOperator = typeof LOGIC_OPERATORS[keyof typeof LOGIC_OPERATORS];

// Option type for select inputs
export interface FilterOption {
  label: string;
  value: string | number | boolean;
  [key: string]: any;
}

/**
 * Function to evaluate if a filter condition is met
 */
export type OperatorEvaluator = (
  targetValue: any, 
  filterValue: any,
  config?: FilterConfig
) => boolean;

/**
 * Definition of an operator
 */
export interface OperatorDefinition {
  id: string;
  label: string;
  evaluator?: OperatorEvaluator;
  component?: string; // Optional custom component name for this operator
  [key: string]: any;
}

/**
 * Definition of a filter type
 */
export interface FilterTypeDefinition {
  id: string;
  label: string;
  operators: string[]; // IDs of supported operators
  defaultOperator: string;
  defaultValue: any;
  component?: string; // Optional custom component name
  [key: string]: any;
}

/**
 * Configuration for filter instances
 */
export interface FilterConfig {
  id: string;
  label: string;
  filterType: FilterType;
  placeholder?: string;
  options?: FilterOption[];
  availableOperators?: string[]; // Override default operators for this filter
  defaultOperator?: string;
  defaultValue?: any;
  component?: React.ComponentType<any>; // Custom component
  context?: Record<string, any>; // Additional context data for this filter
  [key: string]: any;
}

/**
 * Filter condition representation
 */
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  active?: boolean;
}

/**
 * Filter group representation (for advanced filtering)
 */
export interface FilterGroup {
  id: string;
  logicOperator: LogicOperator;
  conditions: FilterCondition[];
  groups?: FilterGroup[];
  active?: boolean;
}

/**
 * Configuration for the operator manager
 */
export interface OperatorConfig {
  operators?: Record<string, Omit<OperatorDefinition, 'id'> & { value: string }>;
  typeOperators?: Record<FilterType, string[]>;
}

/**
 * System-wide filter configuration
 */
export interface FilterSystemConfig {
  operators: Record<string, OperatorDefinition>;
  filterTypes: Record<string, FilterTypeDefinition>;
}

/**
 * Main filter configuration object
 */
export interface FilterConfiguration {
  systemConfig?: FilterSystemConfig;
  filters: FilterConfig[];
  defaultLogicOperator?: LogicOperator;
  maxConditions?: number;
  enableAdvancedFilter?: boolean;
  defaultMode?: 'basic' | 'advanced';
  context?: Record<string, any>; // Global context
  operatorConfig?: OperatorConfig;
}

/**
 * Props for the FilterComponent
 */
export interface FilterComponentProps {
  config: FilterConfiguration;
  initialValue?: FilterGroup;
  onChange?: (filterState: any) => void;
  className?: string;
}

/**
 * Props for the filter input components
 */
export interface FilterInputProps {
  filterId: string;
  operator: FilterOperator;
  value: any;
  onChange: (id: string, value: any) => void;
  config?: FilterConfig;
  context?: Record<string, any>;
}