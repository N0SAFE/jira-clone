import { 
  OperatorEvaluator, 
  FilterOperator, 
  OperatorConfig, 
  OperatorDefinition,
  FilterConfig,
  FilterType
} from './types'

// Built-in operator evaluators
const defaultOperatorEvaluators: Record<string, OperatorEvaluator> = {
  contains: (targetValue: any, filterValue: any) => {
    return String(targetValue).toLowerCase().includes(String(filterValue).toLowerCase())
  },
  
  equals: (targetValue: any, filterValue: any) => {
    if (typeof filterValue === 'boolean') {
      return filterValue === targetValue
    }
    if (typeof filterValue === 'number') {
      return filterValue === Number(targetValue)
    }
    return String(targetValue).toLowerCase() === String(filterValue).toLowerCase()
  },
  
  startsWith: (targetValue: any, filterValue: any) => {
    return String(targetValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
  },
  
  endsWith: (targetValue: any, filterValue: any) => {
    return String(targetValue).toLowerCase().endsWith(String(filterValue).toLowerCase())
  },
  
  greaterThan: (targetValue: any, filterValue: any, config?: FilterConfig) => {
    if (config?.type === 'date') {
      const targetDate = new Date(targetValue).getTime()
      const filterDate = new Date(filterValue).getTime()
      return targetDate > filterDate
    }
    return Number(targetValue) > Number(filterValue)
  },
  
  lessThan: (targetValue: any, filterValue: any, config?: FilterConfig) => {
    if (config?.type === 'date') {
      const targetDate = new Date(targetValue).getTime()
      const filterDate = new Date(filterValue).getTime()
      return targetDate < filterDate
    }
    return Number(targetValue) < Number(filterValue)
  },
  
  greaterThanOrEqual: (targetValue: any, filterValue: any, config?: FilterConfig) => {
    if (config?.type === 'date') {
      const targetDate = new Date(targetValue).getTime()
      const filterDate = new Date(filterValue).getTime()
      return targetDate >= filterDate
    }
    return Number(targetValue) >= Number(filterValue)
  },
  
  lessThanOrEqual: (targetValue: any, filterValue: any, config?: FilterConfig) => {
    if (config?.type === 'date') {
      const targetDate = new Date(targetValue).getTime()
      const filterDate = new Date(filterValue).getTime()
      return targetDate <= filterDate
    }
    return Number(targetValue) <= Number(filterValue)
  },
  
  between: (targetValue: any, filterValue: any, config?: FilterConfig) => {
    if (!Array.isArray(filterValue) || filterValue.length !== 2) {
      return true
    }
    
    const [min, max] = filterValue
    
    if (min === null && max === null) {
      return true
    }
    
    if (config?.type === 'date') {
      const targetDate = new Date(targetValue).getTime()
      const minValid = min === null || targetDate >= new Date(min).getTime()
      const maxValid = max === null || targetDate <= new Date(max).getTime()
      return minValid && maxValid
    }
    
    const numTarget = Number(targetValue)
    const minValid = min === null || numTarget >= min
    const maxValid = max === null || numTarget <= max
    return minValid && maxValid
  },
  
  in: (targetValue: any, filterValue: any) => {
    if (!Array.isArray(filterValue)) {
      return false
    }
    return filterValue.some(val => 
      String(val).toLowerCase() === String(targetValue).toLowerCase()
    )
  },
  
  notIn: (targetValue: any, filterValue: any) => {
    if (!Array.isArray(filterValue)) {
      return true
    }
    return !filterValue.some(val => 
      String(val).toLowerCase() === String(targetValue).toLowerCase()
    )
  },
  
  isEmpty: (targetValue: any) => {
    return targetValue === null || targetValue === undefined || 
      (typeof targetValue === 'string' && targetValue.trim() === '') ||
      (Array.isArray(targetValue) && targetValue.length === 0)
  },
  
  isNotEmpty: (targetValue: any) => {
    return !(targetValue === null || targetValue === undefined || 
      (typeof targetValue === 'string' && targetValue.trim() === '') ||
      (Array.isArray(targetValue) && targetValue.length === 0))
  }
}

// Default operator definitions
export const DEFAULT_OPERATOR_DEFINITIONS: Record<string, OperatorDefinition> = {
  contains: { value: 'contains', label: 'Contains', evaluator: defaultOperatorEvaluators.contains },
  equals: { value: 'equals', label: 'Equals', evaluator: defaultOperatorEvaluators.equals },
  startsWith: { value: 'startsWith', label: 'Starts with', evaluator: defaultOperatorEvaluators.startsWith },
  endsWith: { value: 'endsWith', label: 'Ends with', evaluator: defaultOperatorEvaluators.endsWith },
  between: { value: 'between', label: 'Between', evaluator: defaultOperatorEvaluators.between },
  in: { value: 'in', label: 'In', evaluator: defaultOperatorEvaluators.in },
  notIn: { value: 'notIn', label: 'Not in', evaluator: defaultOperatorEvaluators.notIn },
  greaterThan: { value: 'greaterThan', label: 'Greater than', evaluator: defaultOperatorEvaluators.greaterThan },
  lessThan: { value: 'lessThan', label: 'Less than', evaluator: defaultOperatorEvaluators.lessThan },
  greaterThanOrEqual: { value: 'greaterThanOrEqual', label: 'Greater than or equal', evaluator: defaultOperatorEvaluators.greaterThanOrEqual },
  lessThanOrEqual: { value: 'lessThanOrEqual', label: 'Less than or equal', evaluator: defaultOperatorEvaluators.lessThanOrEqual },
  isEmpty: { value: 'isEmpty', label: 'Is empty', evaluator: defaultOperatorEvaluators.isEmpty },
  isNotEmpty: { value: 'isNotEmpty', label: 'Is not empty', evaluator: defaultOperatorEvaluators.isNotEmpty }
}

// Default type operators mapping
export const DEFAULT_TYPE_OPERATORS: Record<FilterType, string[]> = {
  text: ['contains', 'equals', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  select: ['equals', 'isEmpty'],
  'multi-select': ['in', 'notIn', 'isEmpty'],
  date: ['equals', 'between', 'greaterThan', 'lessThan', 'isEmpty'],
  number: ['equals', 'between', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual', 'isEmpty'],
  boolean: ['equals'],
  custom: ['custom']
}

export class OperatorManager {
  private operators: Record<string, OperatorDefinition> = {}
  private typeOperators: Record<FilterType, string[]> = { ...DEFAULT_TYPE_OPERATORS }

  constructor(operatorConfig?: OperatorConfig) {
    // Initialize with default operators
    this.operators = { ...DEFAULT_OPERATOR_DEFINITIONS }

    // Apply custom configurations
    if (operatorConfig) {
      // Add or override operator definitions
      if (operatorConfig.operators) {
        for (const [key, opDef] of Object.entries(operatorConfig.operators)) {
          this.operators[key] = {
            ...opDef,
            // Use default evaluator if not provided
            evaluator: opDef.evaluator || this.operators[key]?.evaluator
          }
        }
      }

      // Override type operators if provided
      if (operatorConfig.typeOperators) {
        for (const [type, operators] of Object.entries(operatorConfig.typeOperators)) {
          this.typeOperators[type as FilterType] = operators
        }
      }
    }
  }

  // Get operator definition by value
  getOperator(operatorValue: string): OperatorDefinition | undefined {
    return this.operators[operatorValue]
  }

  // Evaluate a filter condition
  evaluateOperator(
    operator: FilterOperator,
    targetValue: any,
    filterValue: any,
    config?: FilterConfig
  ): boolean {
    // Check if operator exists
    const operatorDef = this.getOperator(operator)
    
    if (!operatorDef?.evaluator) {
      console.warn(`No evaluator found for operator: ${operator}`)
      return true
    }

    return operatorDef.evaluator(targetValue, filterValue, config)
  }

  // Get available operators for a filter type
  getOperatorsForType(type: FilterType): OperatorDefinition[] {
    const operatorKeys = this.typeOperators[type] || []
    return operatorKeys
      .map(key => this.operators[key])
      .filter(Boolean) // Filter out any undefined operators
  }

  // Add a new custom operator
  addOperator(key: string, definition: OperatorDefinition): void {
    this.operators[key] = definition
  }

  // Set available operators for a filter type
  setTypeOperators(type: FilterType, operatorKeys: string[]): void {
    this.typeOperators[type] = operatorKeys
  }
}