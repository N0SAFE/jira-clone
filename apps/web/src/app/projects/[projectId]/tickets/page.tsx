'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'
import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { formatDate } from '@/lib/utils'
import { cn } from '@repo/ui/lib/utils'
import { DataTable } from '@repo/ui/components/atomics/organisms/DataTable'
import { DataTableProvider } from '@repo/ui/components/atomics/organisms/DataTable/DataTableContext'
import { DataTablePagination } from '@repo/ui/components/atomics/organisms/DataTable/DataTablePagination'
import { DataTableFilter } from '@repo/ui/components/atomics/organisms/DataTable/DataTableFilter'
import { TableCell, TableRow } from '@repo/ui/components/shadcn/table'
import { flexRender } from '@tanstack/react-table'
import { ProjectsProjectIdTicketsTicketId } from '@/routes'
import { ticketFilterConfig } from './filter-config'
import type { FilterManagerState } from '@repo/ui/components/atomics/organisms/DataTable/filters/types'
import { useColumns } from './columns'

export default function TicketsPage() {
  const { data: project } = useProject() ?? {}
  const tableRef = useRef(null)
  const router = useRouter()

  // Get initial filter state from URL parameters
  const getInitialFilterState = () => {
    if (typeof window === 'undefined') return undefined

    const params = new URLSearchParams(window.location.search)
    const filters = []
    const seenFilters = new Set()

    // Extract basic filters
    for (const [key, value] of params.entries()) {
      if (key.startsWith('filter.')) {
        const [, filterId] = key.split('.')
        if (!filterId || seenFilters.has(filterId)) continue

        seenFilters.add(filterId)
        const operator = params.get(`filter.${filterId}.operator`) || 'contains'
        
        filters.push({
          id: filterId,
          value,
          operator,
        })
      }
    }

    // Extract advanced filter
    const advancedFilter = params.get('advancedFilter')
    
    return {
      filters,
      advancedFilter: advancedFilter ? JSON.parse(advancedFilter) : null
    }
  }

  const { data: tickets = [], isFetched } = useQuery({
    queryKey: ['projects', project?.id, 'tickets'],
    queryFn: async () => {
      return directus.Tickets.query({
        filter: {
          project: project?.id,
        },
        fields: [
          'id',
          'title',
          'status',
          'priority',
          'description',
          'date_created',
          'date_updated',
          {
            user_created: ['first_name', 'last_name'],
          },
          {
            assignee: ['first_name', 'last_name'],
          },
        ],
      })
    },
    enabled: !!project?.id,
  })

  const { data: colors = [] } = useQuery({
    queryKey: ['projects', project?.id, 'tickets', 'colors'],
    queryFn: async () => {
      return directus.TicketsStatuses.query({
        filter: {
          project: project?.id,
        },
        fields: ['color', 'id', 'name'],
      })
    },
    enabled: !!project?.id,
  })

  const { data: priorities = [] } = useQuery({
    queryKey: ['projects', project?.id, 'tickets', 'priorities'],
    queryFn: async () => {
      return directus.TicketsPriorities.query({
        filter: {
          project: project?.id,
        },
        fields: ['color', 'id', 'name'],
      })
    },
    enabled: !!project?.id,
  })

  const columns = useColumns({
    colors: colors,
    priorities: priorities,
  })

  const handleFilterChange = (filterState: FilterManagerState) => {
    // Save to URL params:
    const params = new URLSearchParams(window.location.search)
    
    // Save basic filters
    filterState.filters.forEach(filter => {
      if (filter.value) {
        params.set(`filter.${filter.id}`, filter.value)
        params.set(`filter.${filter.id}.operator`, filter.operator)
      } else {
        params.delete(`filter.${filter.id}`)
        params.delete(`filter.${filter.id}.operator`)
      }
    })

    // Save advanced filter if active
    if (filterState.advancedFilter) {
      params.set('advancedFilter', JSON.stringify(filterState.advancedFilter))
    } else {
      params.delete('advancedFilter')
    }

    // Update URL without reloading
    window.history.replaceState(
      {}, 
      '', 
      `${window.location.pathname}?${params.toString()}`
    )
  }

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      <DataTableProvider
        columns={columns}
        data={tickets ?? []}
        tableRef={tableRef}
      >
        <DataTableFilter 
          config={ticketFilterConfig}
          initialState={getInitialFilterState()}
          onFilterChange={handleFilterChange}
        />
        
        <DataTable
          isLoading={!isFetched}
          notFound="No tickets found"
          row={(row) => (
            <TableRow
              className="hover:bg-accent/50 hover:cursor-pointer"
              data-state={row.getIsSelected() && 'selected'}
              onClick={() => {
                const rowId = row.original.id
                if (rowId) {
                  ProjectsProjectIdTicketsTicketId.immediate(
                    router, 
                    { 
                      projectId: project?.id,
                      ticketId: rowId
                    }
                  )
                }
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          )}
        />
        <DataTablePagination />
      </DataTableProvider>
    </div>
  )
}