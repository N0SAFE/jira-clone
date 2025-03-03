import { 
  FilterSystemConfig,
  FilterConfig, 
  OperatorDefinition, 
  FilterTypeDefinition,
  FilterOperator,
  OPERATORS,
  FILTER_TYPES
} from './types';
import { DEFAULT_FILTER_SYSTEM_CONFIG } from './defaultFilterConfig';

/**
 * FilterSystem is the central class that manages operator definitions and filter types.
 * It provides methods to evaluate filter conditions and retrieve configuration details.
 */
export class FilterSystem {
  private config: FilterSystemConfig;

  constructor(config?: Partial<FilterSystemConfig>) {
    // Start with default configuration
    this.config = { ...DEFAULT_FILTER_SYSTEM_CONFIG };

    if (config) {
      // Merge custom operators
      if (config.operators) {
        this.config.operators = {
          ...this.config.operators,
          ...config.operators
        };
      }

      // Merge custom filter types
      if (config.filterTypes) {
        this.config.filterTypes = {
          ...this.config.filterTypes,
          ...config.filterTypes
        };
      }
    }
  }

  /**
   * Get all available operators
   */
  getOperators(): Record<string, OperatorDefinition> {
    return this.config.operators;
  }

  /**
   * Get a specific operator definition by ID
   */
  getOperator(operatorId: string): OperatorDefinition | undefined {
    return this.config.operators[operatorId];
  }

  /**
   * Get all available filter types
   */
  getFilterTypes(): Record<string, FilterTypeDefinition> {
    return this.config.filterTypes;
  }

  /**
   * Get a specific filter type definition by ID
   */
  getFilterType(typeId: string): FilterTypeDefinition | undefined {
    return this.config.filterTypes[typeId];
  }

  /**
   * Get operators available for a specific filter type
   */
  getOperatorsForFilterType(typeId: string): OperatorDefinition[] {
    const filterType = this.getFilterType(typeId);
    if (!filterType) return [];

    return filterType.operators
      .map(opId => this.getOperator(opId))
      .filter(Boolean) as OperatorDefinition[];
  }

  /**
   * Evaluate a filter condition based on operator
   */
  evaluateFilter(
    operator: FilterOperator, 
    targetValue: any, 
    filterValue: any,
    config?: FilterConfig
  ): boolean {
    // Special case: value is "__all__" which means no filtering
    if (filterValue === '__all__') return true;
    
    const operatorDef = this.getOperator(operator);
    
    // If operator has no evaluator function, return true (no filtering)
    if (!operatorDef || !operatorDef.evaluator) {
      console.warn(`No evaluator found for operator: ${operator}`);
      return true;
    }
    
    // Execute the operator's evaluator function
    return operatorDef.evaluator(targetValue, filterValue, config);
  }

  /**
   * Get the default operator for a filter type
   */
  getDefaultOperator(typeId: string): string {
    const filterType = this.getFilterType(typeId);
    if (!filterType) {
      // Fallback to contains for text if type not found
      return OPERATORS.CONTAINS;
    }
    return filterType.defaultOperator;
  }

  /**
   * Get the default value for a filter type
   */
  getDefaultValue(typeId: string): any {
    const filterType = this.getFilterType(typeId);
    if (!filterType) {
      // Fallback to empty string if type not found
      return '';
    }
    return filterType.defaultValue;
  }

  /**
   * Create a new operator and add it to the system
   */
  addOperator(operatorDef: OperatorDefinition): void {
    this.config.operators[operatorDef.id] = operatorDef;
  }

  /**
   * Create a new filter type and add it to the system
   */
  addFilterType(filterTypeDef: FilterTypeDefinition): void {
    this.config.filterTypes[filterTypeDef.id] = filterTypeDef;
  }
}