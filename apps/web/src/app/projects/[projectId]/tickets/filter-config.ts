import { 
  FilterConfiguration, 
  FILTER_TYPES,
  OPERATORS, 
  FilterSystemConfig,
  OperatorDefinition
} from '@repo/ui/components/atomics/organisms/DataTable/filters/types'
import { DEFAULT_FILTER_SYSTEM_CONFIG } from '@repo/ui/components/atomics/organisms/DataTable/filters/defaultFilterConfig'

/**
 * Ticket-specific operators for enhanced filtering capabilities.
 * These operators are designed specifically for ticket management workflows.
 */
const ticketOperators: Record<string, OperatorDefinition> = {
  assignedToMe: {
    id: 'assignedToMe',
    label: 'Assigned to me',
    evaluator: (targetValue, _, config) => {
      const currentUserId = config?.context?.currentUserId
      if (!currentUserId) return false
      return targetValue === currentUserId
    }
  },
  reportedByMe: {
    id: 'reportedByMe',
    label: 'Reported by me',
    evaluator: (targetValue, _, config) => {
      const currentUserId = config?.context?.currentUserId
      if (!currentUserId) return false
      return targetValue === currentUserId
    }
  },
  lastUpdatedRecently: {
    id: 'lastUpdatedRecently',
    label: 'Updated recently',
    evaluator: (targetValue) => {
      if (!targetValue) return false
      const date = new Date(targetValue)
      const now = new Date()
      const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
      return daysDiff <= 7 // Last 7 days
    }
  },
  dueSoon: {
    id: 'dueSoon',
    label: 'Due soon',
    evaluator: (targetValue) => {
      if (!targetValue) return false
      const date = new Date(targetValue)
      const now = new Date()
      const daysDiff = (date.getTime() - now.getTime()) / (1000 * 3600 * 24)
      return daysDiff > 0 && daysDiff <= 7 // Next 7 days
    }
  },
  overdue: {
    id: 'overdue',
    label: 'Overdue',
    evaluator: (targetValue) => {
      if (!targetValue) return false
      const date = new Date(targetValue)
      return date.getTime() < new Date().getTime()
    }
  },
  watchedByMe: {
    id: 'watchedByMe',
    label: 'Watched by me',
    evaluator: (targetValue, _, config) => {
      const currentUserId = config?.context?.currentUserId
      if (!currentUserId || !Array.isArray(targetValue)) return false
      return targetValue.includes(currentUserId)
    }
  }
}

/**
 * Extended filter system configuration combining default filters with custom ticket filters.
 * This creates a comprehensive filtering system specific to the ticket management workflow.
 * 
 * @see docs/filters.md for detailed documentation
 */
const ticketSystemConfig: FilterSystemConfig = {
  operators: {
    ...DEFAULT_FILTER_SYSTEM_CONFIG.operators,
    ...ticketOperators
  },
  filterTypes: {
    ...DEFAULT_FILTER_SYSTEM_CONFIG.filterTypes,
    // Custom filter types for ticket-specific fields
    user: {
      id: 'user',
      label: 'User',
      operators: [
        OPERATORS.EQUALS,
        OPERATORS.CONTAINS,
        'assignedToMe',
        'reportedByMe',
        OPERATORS.IS_EMPTY
      ],
      defaultOperator: OPERATORS.EQUALS,
      defaultValue: null
    },
    watchers: {
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
    priority: {
      id: 'priority',
      label: 'Priority',
      operators: [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.IS_EMPTY
      ],
      defaultOperator: OPERATORS.EQUALS,
      defaultValue: null
    }
  }
}

/**
 * Predefined status options with color indicators
 */
const statusOptions = [
  { value: 'open', label: '🔵 Open' },
  { value: 'in_progress', label: '🟡 In Progress' },
  { value: 'in_review', label: '🟣 In Review' },
  { value: 'testing', label: '🟠 Testing' },
  { value: 'done', label: '🟢 Done' },
  { value: 'closed', label: '⚫ Closed' },
  { value: 'blocked', label: '🔴 Blocked' }
]

/**
 * Predefined priority levels with color indicators
 */
const priorityOptions = [
  { value: 'highest', label: '🔴 Highest' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
  { value: 'lowest', label: '🔵 Lowest' }
]

/**
 * Predefined ticket types with icons
 */
const typeOptions = [
  { value: 'bug', label: '🐞 Bug' },
  { value: 'feature', label: '✨ Feature' },
  { value: 'task', label: '📋 Task' },
  { value: 'story', label: '📖 Story' },
  { value: 'epic', label: '🚀 Epic' }
]

/**
 * Complete filter configuration for the Tickets list.
 * 
 * This configuration defines:
 * - All available filters for tickets
 * - Custom operators and filter types
 * - Default filtering behavior
 * - Context for user-specific filtering
 * 
 * @see docs/filters.md for detailed documentation
 */
export const ticketFilterConfig: FilterConfiguration = {
  // Use our system configuration with custom operators and filter types
  systemConfig: ticketSystemConfig,
  
  // Define all available filters
  filters: [
    {
      id: 'title',
      label: 'Title',
      filterType: FILTER_TYPES.TEXT,
      placeholder: 'Search by title...',
      defaultOperator: OPERATORS.CONTAINS
    },
    {
      id: 'type',
      label: 'Type',
      filterType: FILTER_TYPES.SELECT,
      options: typeOptions
    },
    {
      id: 'status',
      label: 'Status',
      filterType: FILTER_TYPES.SELECT,
      options: statusOptions
    },
    {
      id: 'priority',
      label: 'Priority',
      filterType: 'priority',
      options: priorityOptions
    },
    {
      id: 'description',
      label: 'Description',
      filterType: FILTER_TYPES.TEXT,
      placeholder: 'Search in description...',
      defaultOperator: OPERATORS.CONTAINS
    },
    {
      id: 'assignee',
      label: 'Assignee',
      filterType: 'user',
      placeholder: 'Filter by assignee...'
    },
    {
      id: 'created_at',
      label: 'Created',
      filterType: FILTER_TYPES.DATE,
      availableOperators: [
        OPERATORS.EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        OPERATORS.BETWEEN,
        OPERATORS.IS_EMPTY
      ]
    },
    {
      id: 'updated_at',
      label: 'Updated',
      filterType: FILTER_TYPES.DATE,
      availableOperators: [
        OPERATORS.EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        'lastUpdatedRecently',
        OPERATORS.BETWEEN
      ],
      defaultOperator: 'lastUpdatedRecently'
    },
    {
      id: 'comments',
      label: 'Has Comments',
      filterType: FILTER_TYPES.BOOLEAN
    },
  ],
  
  // General settings
  enableAdvancedFilter: true,
  defaultLogicOperator: 'AND',
  maxConditions: 10,
  defaultMode: 'basic',
  
  // Global context for evaluators
  context: {
    // Will be set from the user session in TicketsPage component
    currentUserId: null,
    // Will be set from the project context in TicketsPage component
    currentProjectId: null, 
    dateFormat: 'dd MMM yyyy'
  }
}