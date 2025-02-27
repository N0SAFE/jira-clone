export type FilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'between' | 'in' | 'notIn'

export type FilterType = 'text' | 'select' | 'multi-select' | 'date' | 'number' | 'boolean'

export type FilterMode = 'basic' | 'advanced'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  id: string
  label: string
  type: FilterType
  placeholder?: string
  operators?: FilterOperator[]
  options?: FilterOption[]
  defaultOperator?: FilterOperator
  defaultValue?: any
}

export interface FilterState {
  id: string
  value: any
  operator: FilterOperator
}

export interface AdvancedFilterState {
  conditions: FilterState[]
  logicOperator: 'AND' | 'OR'
}

export interface FilterManagerState {
  mode: FilterMode
  filters: FilterState[]
  advancedFilter: AdvancedFilterState | null
}

export interface FilterConfiguration {
  filters: FilterConfig[]
  defaultLogicOperator?: 'AND' | 'OR'
  maxConditions?: number
  enableAdvancedFilter?: boolean
  defaultMode?: FilterMode
}