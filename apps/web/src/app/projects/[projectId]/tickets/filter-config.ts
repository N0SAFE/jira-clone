import type { FilterConfiguration } from '@repo/ui/components/atomics/organisms/DataTable/filters/types'

export const ticketFilterConfig: FilterConfiguration = {
  filters: [
    {
      id: 'title',
      label: 'Title',
      type: 'text',
      placeholder: 'Search by title...',
      operators: ['contains', 'equals', 'startsWith', 'endsWith'],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      operators: ['equals'],
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' }
      ]
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'select',
      operators: ['equals'],
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      id: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Search in description...',
      operators: ['contains', 'equals', 'startsWith', 'endsWith'],
    },
    {
      id: 'assignee',
      label: 'Assignee',
      type: 'text',
      placeholder: 'Search by assignee name...',
      operators: ['contains', 'equals'],
    },
    {
      id: 'date_created',
      label: 'Created Date',
      type: 'date',
      operators: ['equals', 'between'],
    },
    {
      id: 'date_updated',
      label: 'Updated Date',
      type: 'date',
      operators: ['equals', 'between'],
    }
  ],
  enableAdvancedFilter: true,
  defaultLogicOperator: 'AND',
  maxConditions: 5
}