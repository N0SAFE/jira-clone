import { 
  FilterConfiguration, 
  FilterSystemConfig, 
  OperatorDefinition,
  FilterTypeDefinition,
  OPERATORS,
  FILTER_TYPES
} from '../types';
import { DEFAULT_FILTER_SYSTEM_CONFIG } from '../defaultFilterConfig';

// Custom operators for ticket-specific functionality
const customOperators: Record<string, OperatorDefinition> = {
  'assignedToMe': {
    id: 'assignedToMe',
    label: 'Assigned to me',
    evaluator: (targetValue, _, config) => {
      // This would use the current user ID from context
      const currentUserId = config?.context?.currentUserId;
      if (!currentUserId) return false;
      return targetValue === currentUserId;
    }
  },
  'reportedByMe': {
    id: 'reportedByMe',
    label: 'Reported by me',
    evaluator: (targetValue, _, config) => {
      // This would use the current user ID from context
      const currentUserId = config?.context?.currentUserId;
      if (!currentUserId) return false;
      return targetValue === currentUserId;
    }
  },
  'watchedByMe': {
    id: 'watchedByMe',
    label: 'Watched by me',
    evaluator: (targetValue, _, config) => {
      // This would check if current user is in watchers array
      const currentUserId = config?.context?.currentUserId;
      if (!currentUserId || !Array.isArray(targetValue)) return false;
      return targetValue.includes(currentUserId);
    }
  },
  'lastUpdatedRecently': {
    id: 'lastUpdatedRecently',
    label: 'Updated recently',
    evaluator: (targetValue) => {
      if (!targetValue) return false;
      const date = new Date(targetValue);
      const now = new Date();
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
      return daysDiff <= 7; // Last 7 days
    }
  }
};

// Custom filter types for tickets
const customFilterTypes: Record<string, FilterTypeDefinition> = {
  'user': {
    id: 'user',
    label: 'User',
    operators: [
      OPERATORS.EQUALS, 
      OPERATORS.IS_EMPTY,
      'assignedToMe',
      'reportedByMe'
    ],
    defaultOperator: OPERATORS.EQUALS,
    defaultValue: '__all__'
  },
  'watchers': {
    id: 'watchers',
    label: 'Watchers',
    operators: [
      'watchedByMe',
      OPERATORS.IS_EMPTY,
      OPERATORS.IS_NOT_EMPTY
    ],
    defaultOperator: 'watchedByMe',
    defaultValue: null
  },
  'priority': {
    id: 'priority',
    label: 'Priority',
    operators: [
      OPERATORS.EQUALS,
      OPERATORS.NOT_EQUALS,
      OPERATORS.IS_EMPTY
    ],
    defaultOperator: OPERATORS.EQUALS,
    defaultValue: '__all__'
  }
};

// Create the system config by extending the default one
const ticketSystemConfig: FilterSystemConfig = {
  operators: {
    ...DEFAULT_FILTER_SYSTEM_CONFIG.operators,
    ...customOperators
  },
  filterTypes: {
    ...DEFAULT_FILTER_SYSTEM_CONFIG.filterTypes,
    ...customFilterTypes
  }
};

// Status options for the filter
const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'qa', label: 'QA Testing' },
  { value: 'done', label: 'Done' },
  { value: 'closed', label: 'Closed' }
];

// Priority options
const priorityOptions = [
  { value: 'highest', label: '🔴 Highest' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
  { value: 'lowest', label: '🔵 Lowest' }
];

// Type options
const typeOptions = [
  { value: 'bug', label: '🐞 Bug' },
  { value: 'feature', label: '✨ Feature' },
  { value: 'task', label: '📋 Task' },
  { value: 'story', label: '📖 Story' },
  { value: 'epic', label: '🚀 Epic' }
];

// User options (would typically come from API)
const userOptions = [
  { value: 'user1', label: 'John Smith' },
  { value: 'user2', label: 'Alice Johnson' },
  { value: 'user3', label: 'Bob Williams' },
  { value: 'user4', label: 'Sarah Davis' }
];

// Complete filter configuration for tickets list
export const TICKETS_FILTER_CONFIG: FilterConfiguration = {
  // Use our custom system config
  systemConfig: ticketSystemConfig,
  
  // Define all available filters
  filters: [
    {
      id: 'title',
      label: 'Title',
      filterType: FILTER_TYPES.TEXT,
      placeholder: 'Filter by title...'
    },
    {
      id: 'description',
      label: 'Description',
      filterType: FILTER_TYPES.TEXT,
      placeholder: 'Filter by description...'
    },
    {
      id: 'status',
      label: 'Status',
      filterType: FILTER_TYPES.SELECT,
      options: statusOptions
    },
    {
      id: 'type',
      label: 'Type',
      filterType: FILTER_TYPES.SELECT,
      options: typeOptions
    },
    {
      id: 'priority',
      label: 'Priority',
      filterType: 'priority', // Using our custom filter type
      options: priorityOptions
    },
    {
      id: 'assignee',
      label: 'Assignee',
      filterType: 'user', // Using our custom filter type
      options: userOptions
    },
    {
      id: 'reporter',
      label: 'Reporter',
      filterType: 'user',
      options: userOptions
    },
    {
      id: 'watchers',
      label: 'Watchers',
      filterType: 'watchers'
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      filterType: FILTER_TYPES.DATE
    },
    {
      id: 'updatedAt',
      label: 'Updated Date',
      filterType: FILTER_TYPES.DATE,
      // Override the available operators for this specific field
      availableOperators: [
        OPERATORS.EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        'lastUpdatedRecently'
      ],
      defaultOperator: 'lastUpdatedRecently'
    },
    {
      id: 'storyPoints',
      label: 'Story Points',
      filterType: FILTER_TYPES.NUMBER
    }
  ],
  
  // General settings
  defaultLogicOperator: 'AND',
  maxConditions: 10,
  enableAdvancedFilter: true,
  defaultMode: 'basic',
  
  // Global context available to all filters
  context: {
    currentUserId: 'user1', // Would come from auth context
    dateFormat: 'dd MMM yyyy'
  }
};

// Example usage in a component:
/*
import { TICKETS_FILTER_CONFIG } from './TicketsFilterConfig';
import { FilterComponent } from '../FilterComponent';

export function TicketsListPage() {
  const handleFilterChange = (filterState) => {
    // Apply filters to your data
    console.log('Filter state changed:', filterState);
  };

  return (
    <div className="tickets-list">
      <FilterComponent 
        config={TICKETS_FILTER_CONFIG} 
        onChange={handleFilterChange}
      />
      {/* Table with tickets data */}
    </div>
  );
}
*/