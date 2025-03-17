import { FilterConfig, FilterOperator, FilterState } from './types'
import { FilterSystem } from './FilterSystem'

export class FilterValue {
  private config: FilterConfig
  private value: any
  private operator: FilterOperator
  private filterSystem?: FilterSystem

  constructor(
    config: FilterConfig, 
    initialState?: FilterState,
    filterSystem?: FilterSystem
  ) {
    this.config = config
    
    // Get defaults from filter system or fall back to provided defaults
    const defaultOperator = filterSystem?.getDefaultOperator(config.filterType) || 
                          config.defaultOperator || 'contains'
    
    const defaultValue = config.defaultValue ?? 
                        filterSystem?.getDefaultValue(config.filterType) ?? 
                        '';
                        
    this.operator = initialState?.operator || config.defaultOperator || defaultOperator
    this.value = initialState?.value ?? defaultValue
    this.filterSystem = filterSystem
  }

  getValue(): any {
    return this.value
  }

  getOperator(): FilterOperator {
    return this.operator
  }

  setValue(value: any): void {
    this.value = value
  }

  setOperator(operator: FilterOperator): void {
    this.operator = operator
    
    // If operator is changed to between and value isn't an array, initialize it
    if (operator === 'between' && !Array.isArray(this.value)) {
      if (this.config.filterType === 'number' || this.config.filterType === 'date') {
        this.value = [null, null]
      }
    }
    
    // If changed from between to something else and value is array, reset it
    if (operator !== 'between' && Array.isArray(this.value)) {
      this.value = this.getDefaultValue()
    }
  }

  clear(): void {
    this.value = this.getDefaultValue()
    this.operator = this.getDefaultOperator()
  }

  private getDefaultOperator(): FilterOperator {
    if (this.filterSystem) {
      return this.config.defaultOperator || 
             this.filterSystem.getDefaultOperator(this.config.filterType)
    }
    
    // Fallback to hardcoded defaults if no filter system
    switch (this.config.filterType) {
      case 'select':
      case 'boolean':
        return 'equals'
      case 'multi-select':
        return 'in'
      case 'number':
        return 'equals'
      case 'date':
        return 'equals'
      default:
        return 'contains'
    }
  }

  private getDefaultValue(): any {
    if (this.filterSystem) {
      return this.config.defaultValue ?? 
             this.filterSystem.getDefaultValue(this.config.filterType)
    }
    
    // Fallback to hardcoded defaults if no filter system
    switch (this.config.filterType) {
      case 'multi-select':
        return []
      case 'boolean':
        return null
      case 'number':
        return null
      case 'date':
        return null
      case 'select':
        return '__all__' // Special value for "All" option
      default:
        return ''
    }
  }

  isEmpty(): boolean {
    if (this.value === null || this.value === undefined) return true
    
    if (this.operator === 'isEmpty' || this.operator === 'isNotEmpty') return false
    
    if (Array.isArray(this.value)) {
      if (this.value.length === 0) return true
      
      // For between operators, both values need to be set
      if (this.operator === 'between') {
        return this.value[0] === null && this.value[1] === null
      }
      
      // For multi-select, any values make it non-empty
      return false
    }
    
    if (typeof this.value === 'string' && this.value === '__all__') return true
    if (typeof this.value === 'string') return this.value.trim() === ''
    
    return false
  }

  toState(): FilterState {
    return {
      id: this.config.id,
      value: this.value,
      operator: this.operator
    }
  }

  evaluate(targetValue: any): boolean {
    // Special case for the "All" option
    if (this.value === '__all__') return true
    
    // If value is empty (and it's not the isEmpty/isNotEmpty operator), return true (no filter)
    if (this.isEmpty() && this.operator !== 'isEmpty' && this.operator !== 'isNotEmpty') {
      return true
    }
    
    // If using FilterSystem, delegate evaluation to it
    if (this.filterSystem) {
      return this.filterSystem.evaluateFilter(
        this.operator, 
        targetValue, 
        this.value, 
        this.config
      )
    }
    
    // Legacy fallback implementation for backward compatibility
    console.warn('FilterValue: No FilterSystem provided, using legacy evaluation')
    
    // Special operators that don't need target value comparison
    if (this.operator === 'isEmpty') {
      return targetValue === null || targetValue === undefined || 
        (typeof targetValue === 'string' && targetValue.trim() === '') ||
        (Array.isArray(targetValue) && targetValue.length === 0);
    }
    
    if (this.operator === 'isNotEmpty') {
      return !(targetValue === null || targetValue === undefined || 
        (typeof targetValue === 'string' && targetValue.trim() === '') ||
        (Array.isArray(targetValue) && targetValue.length === 0));
    }
    
    // Handle null/undefined target values
    if (targetValue === null || targetValue === undefined) {
      return false
    }

    // Handle different operator types
    switch (this.operator) {
      case 'contains':
        return String(targetValue).toLowerCase().includes(String(this.value).toLowerCase())
        
      case 'equals':
        // Boolean comparison
        if (typeof this.value === 'boolean') {
          return this.value === targetValue
        }
        // Number comparison
        if (typeof this.value === 'number') {
          return this.value === Number(targetValue)
        }
        // Default string comparison
        return String(targetValue).toLowerCase() === String(this.value).toLowerCase()
      
      // ...add other operators as needed for fallback...
        
      default:
        console.warn(`Unknown operator: ${this.operator}`)
        return true
    }
  }
}