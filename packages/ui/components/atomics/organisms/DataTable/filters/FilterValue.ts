import { FilterConfig, FilterOperator, FilterState } from './types'

export class FilterValue {
  private config: FilterConfig
  private value: any
  private operator: FilterOperator

  constructor(config: FilterConfig, initialState?: FilterState) {
    this.config = config
    this.operator = initialState?.operator || config.defaultOperator || this.getDefaultOperator()
    this.value = initialState?.value ?? config.defaultValue ?? this.getDefaultValue()
  }

  private getDefaultOperator(): FilterOperator {
    switch (this.config.type) {
      case 'select':
      case 'boolean':
        return 'equals'
      case 'multi-select':
        return 'in'
      default:
        return 'contains'
    }
  }

  private getDefaultValue(): any {
    switch (this.config.type) {
      case 'multi-select':
        return []
      case 'boolean':
        return false
      case 'number':
        return null
      case 'select':
        return '__all__' // Special value for "All" option
      default:
        return ''
    }
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
  }

  clear(): void {
    this.value = this.getDefaultValue()
    this.operator = this.getDefaultOperator()
  }

  isEmpty(): boolean {
    if (this.value === null || this.value === undefined) return true
    if (Array.isArray(this.value)) return this.value.length === 0
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
    if (this.isEmpty()) return true
    
    // Special case for the "All" option
    if (this.value === '__all__') return true

    const filterValue = String(this.value).toLowerCase()
    const target = String(targetValue).toLowerCase()

    switch (this.operator) {
      case 'contains':
        return target.includes(filterValue)
      case 'equals':
        return target === filterValue
      case 'startsWith':
        return target.startsWith(filterValue)
      case 'endsWith':
        return target.endsWith(filterValue)
      case 'in':
        return Array.isArray(this.value) 
          ? this.value.some(v => String(v).toLowerCase() === target)
          : false
      case 'notIn':
        return Array.isArray(this.value) 
          ? !this.value.some(v => String(v).toLowerCase() === target)
          : true
      default:
        return true
    }
  }
}