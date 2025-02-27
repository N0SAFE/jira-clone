import { FilterConfiguration, FilterState, AdvancedFilterState, FilterConfig } from './types'
import { FilterValue } from './FilterValue'

export class FilterManager {
  private config: FilterConfiguration
  private filters: Map<string, FilterValue>
  private advancedFilter: AdvancedFilterState | null = null
  private changeCallback?: (state: FilterManagerState) => void

  constructor(
    config: FilterConfiguration,
    initialState?: FilterManagerState,
    onChange?: (state: FilterManagerState) => void
  ) {
    this.config = {
      ...config,
      defaultLogicOperator: config.defaultLogicOperator || 'AND',
      maxConditions: config.maxConditions || 5,
      enableAdvancedFilter: config.enableAdvancedFilter ?? true
    }
    
    this.filters = new Map()
    this.changeCallback = onChange

    // Initialize filters
    config.filters.forEach(filterConfig => {
      const initialFilterState = initialState?.filters.find(f => f.id === filterConfig.id)
      this.filters.set(filterConfig.id, new FilterValue(filterConfig, initialFilterState))
    })

    // Initialize advanced filter if present
    if (initialState?.advancedFilter) {
      this.advancedFilter = initialState.advancedFilter
    }
  }

  // Basic filter methods
  setFilter(filterId: string, value: any): void {
    const filter = this.filters.get(filterId)
    if (filter) {
      filter.setValue(value)
      this.notifyChange()
    }
  }

  setFilterOperator(filterId: string, operator: string): void {
    const filter = this.filters.get(filterId)
    if (filter) {
      filter.setOperator(operator)
      this.notifyChange()
    }
  }

  clearFilter(filterId: string): void {
    const filter = this.filters.get(filterId)
    if (filter) {
      filter.clear()
      this.notifyChange()
    }
  }

  clearAllFilters(): void {
    this.filters.forEach(filter => filter.clear())
    this.advancedFilter = null
    this.notifyChange()
  }

  // Advanced filter methods
  setAdvancedFilter(state: AdvancedFilterState): void {
    if (!this.config.enableAdvancedFilter) return

    this.advancedFilter = {
      conditions: state.conditions.slice(0, this.config.maxConditions),
      logicOperator: state.logicOperator
    }
    this.notifyChange()
  }

  clearAdvancedFilter(): void {
    this.advancedFilter = null
    this.notifyChange()
  }

  // State management
  getState(): FilterManagerState {
    return {
      filters: Array.from(this.filters.values()).map(f => f.toState()),
      advancedFilter: this.advancedFilter
    }
  }
  
  getFilterValue(filterId: string): any {
    return this.filters.get(filterId)?.getValue()
  }

  getFilterConfig(filterId: string): FilterConfig | undefined {
    return this.config.filters.find(f => f.id === filterId)
  }

  // Evaluation methods
  evaluateRow(row: Record<string, any>): boolean {
    // If advanced filter is active, use it
    if (this.advancedFilter) {
      return this.evaluateAdvancedFilter(row)
    }

    // Otherwise, evaluate basic filters
    return Array.from(this.filters.entries()).every(([id, filter]) => {
      return filter.evaluate(row[id])
    })
  }

  private evaluateAdvancedFilter(row: Record<string, any>): boolean {
    if (!this.advancedFilter) return true

    const results = this.advancedFilter.conditions.map(condition => {
      const filter = new FilterValue(
        this.getFilterConfig(condition.id)!,
        condition
      )
      return filter.evaluate(row[condition.id])
    })

    return this.advancedFilter.logicOperator === 'AND'
      ? results.every(Boolean)
      : results.some(Boolean)
  }

  private notifyChange(): void {
    if (this.changeCallback) {
      this.changeCallback(this.getState())
    }
  }
}

export interface FilterManagerState {
  filters: FilterState[]
  advancedFilter: AdvancedFilterState | null
}