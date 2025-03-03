import { 
  FilterSystemConfig, 
  OPERATORS, 
  FILTER_TYPES,
  OperatorEvaluator 
} from './types';

// Define all operator evaluators
const operatorEvaluators: Record<string, OperatorEvaluator> = {
  [OPERATORS.EQUALS]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (typeof filterValue === 'boolean') return filterValue === targetValue;
    if (typeof filterValue === 'number') return filterValue === Number(targetValue);
    return String(targetValue).toLowerCase() === String(filterValue).toLowerCase();
  },

  [OPERATORS.NOT_EQUALS]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (typeof filterValue === 'boolean') return filterValue !== targetValue;
    if (typeof filterValue === 'number') return filterValue !== Number(targetValue);
    return String(targetValue).toLowerCase() !== String(filterValue).toLowerCase();
  },

  [OPERATORS.CONTAINS]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    return String(targetValue).toLowerCase().includes(String(filterValue).toLowerCase());
  },

  [OPERATORS.STARTS_WITH]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    return String(targetValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
  },

  [OPERATORS.ENDS_WITH]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    return String(targetValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
  },

  [OPERATORS.GREATER_THAN]: (targetValue, filterValue, config) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (config?.filterType === FILTER_TYPES.DATE) {
      return new Date(targetValue).getTime() > new Date(filterValue).getTime();
    }
    return Number(targetValue) > Number(filterValue);
  },

  [OPERATORS.LESS_THAN]: (targetValue, filterValue, config) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (config?.filterType === FILTER_TYPES.DATE) {
      return new Date(targetValue).getTime() < new Date(filterValue).getTime();
    }
    return Number(targetValue) < Number(filterValue);
  },

  [OPERATORS.GREATER_THAN_OR_EQUAL]: (targetValue, filterValue, config) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (config?.filterType === FILTER_TYPES.DATE) {
      return new Date(targetValue).getTime() >= new Date(filterValue).getTime();
    }
    return Number(targetValue) >= Number(filterValue);
  },

  [OPERATORS.LESS_THAN_OR_EQUAL]: (targetValue, filterValue, config) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (config?.filterType === FILTER_TYPES.DATE) {
      return new Date(targetValue).getTime() <= new Date(filterValue).getTime();
    }
    return Number(targetValue) <= Number(filterValue);
  },

  [OPERATORS.BETWEEN]: (targetValue, filterValue, config) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (!Array.isArray(filterValue) || filterValue.length !== 2) return true;
    
    const [min, max] = filterValue;
    if (min === null && max === null) return true;
    
    if (config?.filterType === FILTER_TYPES.DATE) {
      const targetDate = new Date(targetValue).getTime();
      const minValid = min === null || targetDate >= new Date(min).getTime();
      const maxValid = max === null || targetDate <= new Date(max).getTime();
      return minValid && maxValid;
    }
    
    const numTarget = Number(targetValue);
    const minValid = min === null || numTarget >= min;
    const maxValid = max === null || numTarget <= max;
    return minValid && maxValid;
  },

  [OPERATORS.IN]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (!Array.isArray(filterValue) || filterValue.length === 0) return false;
    return filterValue.some(val => 
      String(val).toLowerCase() === String(targetValue).toLowerCase()
    );
  },

  [OPERATORS.NOT_IN]: (targetValue, filterValue) => {
    if (targetValue === undefined || targetValue === null) return false;
    if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
    return !filterValue.some(val => 
      String(val).toLowerCase() === String(targetValue).toLowerCase()
    );
  },

  [OPERATORS.IS_EMPTY]: (targetValue) => {
    return targetValue === undefined || targetValue === null || 
      (typeof targetValue === 'string' && targetValue.trim() === '') ||
      (Array.isArray(targetValue) && targetValue.length === 0);
  },

  [OPERATORS.IS_NOT_EMPTY]: (targetValue) => {
    return !(targetValue === undefined || targetValue === null || 
      (typeof targetValue === 'string' && targetValue.trim() === '') ||
      (Array.isArray(targetValue) && targetValue.length === 0));
  }
};

// Define default filter system configuration
export const DEFAULT_FILTER_SYSTEM_CONFIG: FilterSystemConfig = {
  // Define all operators
  operators: {
    [OPERATORS.EQUALS]: {
      id: OPERATORS.EQUALS,
      label: 'Equals',
      evaluator: operatorEvaluators[OPERATORS.EQUALS]
    },
    [OPERATORS.NOT_EQUALS]: {
      id: OPERATORS.NOT_EQUALS,
      label: 'Not equals',
      evaluator: operatorEvaluators[OPERATORS.NOT_EQUALS]
    },
    [OPERATORS.CONTAINS]: {
      id: OPERATORS.CONTAINS,
      label: 'Contains',
      evaluator: operatorEvaluators[OPERATORS.CONTAINS]
    },
    [OPERATORS.STARTS_WITH]: {
      id: OPERATORS.STARTS_WITH,
      label: 'Starts with',
      evaluator: operatorEvaluators[OPERATORS.STARTS_WITH]
    },
    [OPERATORS.ENDS_WITH]: {
      id: OPERATORS.ENDS_WITH,
      label: 'Ends with',
      evaluator: operatorEvaluators[OPERATORS.ENDS_WITH]
    },
    [OPERATORS.GREATER_THAN]: {
      id: OPERATORS.GREATER_THAN,
      label: 'Greater than',
      evaluator: operatorEvaluators[OPERATORS.GREATER_THAN]
    },
    [OPERATORS.LESS_THAN]: {
      id: OPERATORS.LESS_THAN,
      label: 'Less than',
      evaluator: operatorEvaluators[OPERATORS.LESS_THAN]
    },
    [OPERATORS.GREATER_THAN_OR_EQUAL]: {
      id: OPERATORS.GREATER_THAN_OR_EQUAL,
      label: 'Greater than or equal',
      evaluator: operatorEvaluators[OPERATORS.GREATER_THAN_OR_EQUAL]
    },
    [OPERATORS.LESS_THAN_OR_EQUAL]: {
      id: OPERATORS.LESS_THAN_OR_EQUAL,
      label: 'Less than or equal',
      evaluator: operatorEvaluators[OPERATORS.LESS_THAN_OR_EQUAL]
    },
    [OPERATORS.BETWEEN]: {
      id: OPERATORS.BETWEEN,
      label: 'Between',
      evaluator: operatorEvaluators[OPERATORS.BETWEEN],
      component: 'range' // Special component needed for between operator
    },
    [OPERATORS.IN]: {
      id: OPERATORS.IN,
      label: 'In',
      evaluator: operatorEvaluators[OPERATORS.IN]
    },
    [OPERATORS.NOT_IN]: {
      id: OPERATORS.NOT_IN,
      label: 'Not in',
      evaluator: operatorEvaluators[OPERATORS.NOT_IN]
    },
    [OPERATORS.IS_EMPTY]: {
      id: OPERATORS.IS_EMPTY,
      label: 'Is empty',
      evaluator: operatorEvaluators[OPERATORS.IS_EMPTY]
    },
    [OPERATORS.IS_NOT_EMPTY]: {
      id: OPERATORS.IS_NOT_EMPTY,
      label: 'Is not empty',
      evaluator: operatorEvaluators[OPERATORS.IS_NOT_EMPTY]
    },
    [OPERATORS.CUSTOM]: {
      id: OPERATORS.CUSTOM,
      label: 'Custom',
      // Custom operator requires special handling
    }
  },

  // Define filter types with their applicable operators
  filterTypes: {
    [FILTER_TYPES.TEXT]: {
      id: FILTER_TYPES.TEXT,
      label: 'Text',
      operators: [
        OPERATORS.CONTAINS,
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.STARTS_WITH,
        OPERATORS.ENDS_WITH,
        OPERATORS.IS_EMPTY,
        OPERATORS.IS_NOT_EMPTY
      ],
      defaultOperator: OPERATORS.CONTAINS,
      defaultValue: ''
    },
    [FILTER_TYPES.SELECT]: {
      id: FILTER_TYPES.SELECT,
      label: 'Select',
      operators: [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.IS_EMPTY
      ],
      defaultOperator: OPERATORS.EQUALS,
      defaultValue: '__all__' // Special value for "All" option
    },
    [FILTER_TYPES.MULTI_SELECT]: {
      id: FILTER_TYPES.MULTI_SELECT,
      label: 'Multi-select',
      operators: [
        OPERATORS.IN,
        OPERATORS.NOT_IN,
        OPERATORS.IS_EMPTY
      ],
      defaultOperator: OPERATORS.IN,
      defaultValue: []
    },
    [FILTER_TYPES.DATE]: {
      id: FILTER_TYPES.DATE,
      label: 'Date',
      operators: [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        OPERATORS.BETWEEN,
        OPERATORS.IS_EMPTY
      ],
      defaultOperator: OPERATORS.EQUALS,
      defaultValue: null
    },
    [FILTER_TYPES.NUMBER]: {
      id: FILTER_TYPES.NUMBER,
      label: 'Number',
      operators: [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        OPERATORS.GREATER_THAN_OR_EQUAL,
        OPERATORS.LESS_THAN_OR_EQUAL,
        OPERATORS.BETWEEN,
        OPERATORS.IS_EMPTY
      ],
      defaultOperator: OPERATORS.EQUALS,
      defaultValue: null
    },
    [FILTER_TYPES.BOOLEAN]: {
      id: FILTER_TYPES.BOOLEAN,
      label: 'Boolean',
      operators: [
        OPERATORS.EQUALS
      ],
      defaultOperator: OPERATORS.EQUALS,
      defaultValue: null
    },
    [FILTER_TYPES.CUSTOM]: {
      id: FILTER_TYPES.CUSTOM,
      label: 'Custom',
      operators: [
        OPERATORS.CUSTOM
      ],
      defaultOperator: OPERATORS.CUSTOM,
      defaultValue: null
    }
  }
};