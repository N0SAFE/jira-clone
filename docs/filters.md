# Advanced Filter System

The Advanced Filter System provides powerful filtering capabilities similar to Directus filter rules, but optimized for the Jira clone application. This document describes the available operators, filter types, and how to use them.

## Operators

The filter system provides the following operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match (case insensitive for strings) | `title` equals "Bug report" |
| `notEquals` | Not an exact match | `status` not equals "done" |
| `contains` | String contains the substring (case insensitive) | `description` contains "error" |
| `startsWith` | String starts with substring (case insensitive) | `title` starts with "PROJ-" |
| `endsWith` | String ends with substring (case insensitive) | `title` ends with "improvement" |
| `isEmpty` | Value is null, undefined, empty string or empty array | `assignee` is empty |
| `isNotEmpty` | Value is not null, not undefined, not empty string or not empty array | `assignee` is not empty |
| `greaterThan` | Value is greater than the filter value | `storyPoints` greater than 5 |
| `lessThan` | Value is less than the filter value | `storyPoints` less than 8 |
| `greaterThanOrEqual` | Value is greater than or equal to the filter value | `priority` greater than or equal to 3 |
| `lessThanOrEqual` | Value is less than or equal to the filter value | `priority` less than or equal to 2 |
| `in` | Value is in the array of filter values | `status` in ["open", "in_progress"] |
| `notIn` | Value is not in the array of filter values | `status` not in ["closed", "done"] |
| `between` | Value is between two filter values | `updated_at` between ["2023-01-01", "2023-12-31"] |

### Ticket-Specific Operators

In addition to the standard operators, the ticket system provides specialized operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `assignedToMe` | Ticket is assigned to the current user | `assignee` assigned to me |
| `reportedByMe` | Ticket was reported by the current user | `reporter` reported by me |
| `watchedByMe` | Ticket is being watched by the current user | `watchers` watched by me |
| `lastUpdatedRecently` | Ticket was updated in the last 7 days | `updated_at` updated recently |
| `dueSoon` | Ticket is due in the next 7 days | `due_date` due soon |
| `overdue` | Ticket is past its due date | `due_date` overdue |

## Filter Types

The system supports multiple filter types, each with its own set of applicable operators:

| Filter Type | Description | Applicable Operators |
|-------------|-------------|---------------------|
| `text` | Text fields like title, description | `contains`, `equals`, `notEquals`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty` |
| `select` | Single selection fields like status, type | `equals`, `notEquals`, `isEmpty` |
| `multiSelect` | Multiple selection fields like labels | `in`, `notIn`, `isEmpty` |
| `date` | Date fields like created_at, due_date | `equals`, `notEquals`, `greaterThan`, `lessThan`, `between`, `isEmpty`, `lastUpdatedRecently`, `dueSoon`, `overdue` |
| `number` | Numeric fields like story points | `equals`, `notEquals`, `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `between`, `isEmpty` |
| `boolean` | Boolean fields like has comments | `equals` |
| `user` | User fields like assignee, reporter | `equals`, `contains`, `isEmpty`, `assignedToMe`, `reportedByMe` |
| `watchers` | For the watchers field | `watchedByMe`, `isEmpty`, `isNotEmpty` |
| `priority` | For the priority field | `equals`, `notEquals`, `isEmpty` |

## Basic vs. Advanced Filtering

The system supports two filtering modes:

### Basic Filtering

Basic filtering allows quick filtering on individual fields with a simplified interface. Each field can have one condition applied.

Example:
```json
{
  "filters": [
    {
      "id": "status",
      "value": "open",
      "operator": "equals"
    },
    {
      "id": "priority",
      "value": "high",
      "operator": "equals"
    }
  ]
}
```

### Advanced Filtering

Advanced filtering supports complex conditions with logical operators (AND/OR) combining multiple conditions.

Example:
```json
{
  "logicOperator": "AND",
  "conditions": [
    {
      "id": "status",
      "operator": "in",
      "value": ["open", "in_progress"]
    },
    {
      "id": "assignee",
      "operator": "assignedToMe",
      "value": null
    },
    {
      "id": "priority",
      "operator": "notEquals",
      "value": "low"
    }
  ]
}
```

## Filter Configuration Example

Here's an example of a complete filter configuration for the tickets list:

```typescript
const ticketFilterConfig: FilterConfiguration = {
  systemConfig: {
    operators: {
      // Standard operators plus custom ticket operators
    },
    filterTypes: {
      // Standard filter types plus custom ticket filter types
    }
  },
  filters: [
    {
      id: 'title',
      label: 'Title',
      filterType: 'text',
      placeholder: 'Search by title...',
      defaultOperator: 'contains'
    },
    {
      id: 'status',
      label: 'Status',
      filterType: 'select',
      options: [
        { value: 'open', label: '🔵 Open' },
        { value: 'in_progress', label: '🟡 In Progress' },
        // ...other options
      ]
    },
    // ...other filters
  ],
  enableAdvancedFilter: true,
  defaultLogicOperator: 'AND',
  maxConditions: 10,
  defaultMode: 'basic',
  context: {
    currentUserId: null, // Set from auth context
    currentProjectId: null, // Set from project context
    dateFormat: 'dd MMM yyyy'
  }
}
```

## Integration with Directus

When using this filter system with Directus, the filter state can be converted to Directus filter query parameters:

```typescript
// Convert a filter state to Directus filter query
function convertToDirectusFilter(filterState) {
  if (filterState.advancedFilter) {
    // Handle advanced filter
    const { logicOperator, conditions } = filterState.advancedFilter;
    const directusFilter = {
      _and: [],
      _or: []
    };
    
    // Map conditions to Directus filter syntax
    const mappedConditions = conditions.map(condition => {
      const { id, operator, value } = condition;
      
      // Map each operator to Directus format
      switch (operator) {
        case 'equals':
          return { [id]: { _eq: value } };
        case 'contains':
          return { [id]: { _contains: value } };
        case 'greaterThan':
          return { [id]: { _gt: value } };
        // ... other operators
      }
    });
    
    // Add conditions to the appropriate logical operator array
    if (logicOperator === 'AND') {
      directusFilter._and = mappedConditions;
    } else {
      directusFilter._or = mappedConditions;
    }
    
    return directusFilter;
  } else {
    // Handle basic filters
    const directusFilter = { _and: [] };
    
    filterState.filters.forEach(filter => {
      if (filter.value && filter.value !== '__all__') {
        // Map each basic filter to Directus format
        switch (filter.operator) {
          case 'equals':
            directusFilter._and.push({ [filter.id]: { _eq: filter.value } });
            break;
          // ... other operators
        }
      }
    });
    
    return directusFilter;
  }
}
```

## Extending the Filter System

The filter system can be extended with custom operators and filter types:

```typescript
// Adding a custom operator
const customOperators = {
  'modifiedByMe': {
    id: 'modifiedByMe',
    label: 'Modified by me',
    evaluator: (targetValue, _, config) => {
      const currentUserId = config?.context?.currentUserId;
      if (!currentUserId || !Array.isArray(targetValue)) return false;
      return targetValue.some(m => m.user_id === currentUserId);
    }
  }
};

// Adding a custom filter type
const customFilterTypes = {
  'history': {
    id: 'history',
    label: 'History',
    operators: [
      'modifiedByMe',
      'isEmpty',
      'isNotEmpty'
    ],
    defaultOperator: 'modifiedByMe',
    defaultValue: null
  }
};

// Update the system config
const extendedSystemConfig = {
  operators: {
    ...DEFAULT_FILTER_SYSTEM_CONFIG.operators,
    ...customOperators
  },
  filterTypes: {
    ...DEFAULT_FILTER_SYSTEM_CONFIG.filterTypes,
    ...customFilterTypes
  }
};
```