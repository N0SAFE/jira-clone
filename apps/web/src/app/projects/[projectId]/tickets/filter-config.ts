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
  filters: [
    {
      id: 'title',
      label: 'Title',
      filterType: FILTER_TYPES.TEXT,
      defaultOperator: 'contains'
    },
    {
      id: 'description',
      label: 'Description',
      filterType: FILTER_TYPES.TEXT,
      defaultOperator: 'contains'
    },
    {
      id: 'status',
      label: 'Status',
      filterType: FILTER_TYPES.SELECT,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Done', value: 'done' }
      ],
      defaultOperator: 'equals'
    },
    {
      id: 'priority',
      label: 'Priority',
      filterType: FILTER_TYPES.SELECT,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ],
      defaultOperator: 'equals'
    },
    {
      id: 'assignee_id',
      label: 'Assignee',
      filterType: FILTER_TYPES.SELECT,
      options: [
        { label: 'Assigned to me', value: 'me' },
        { label: 'Unassigned', value: null }
      ],
      defaultOperator: 'equals'
    },
    {
      id: 'reporter_id',
      label: 'Reporter',
      filterType: FILTER_TYPES.SELECT,
      options: [
        { label: 'Created by me', value: 'me' }
      ],
      defaultOperator: 'equals'
    },
    {
      id: 'created_at',
      label: 'Created Date',
      filterType: FILTER_TYPES.DATE,
      defaultOperator: 'equals',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Week', value: 'thisWeek' },
        { label: 'This Month', value: 'thisMonth' }
      ]
    },
    {
      id: 'updated_at',
      label: 'Last Updated',
      filterType: FILTER_TYPES.DATE,
      defaultOperator: 'equals',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Week', value: 'thisWeek' },
        { label: 'This Month', value: 'thisMonth' }
      ]
    },
    {
      id: 'due_date',
      label: 'Due Date',
      filterType: FILTER_TYPES.DATE,
      defaultOperator: 'equals'
    }
  ],
  enableAdvancedFilter: true,
  defaultMode: 'basic',
  defaultLogicOperator: 'AND'
};