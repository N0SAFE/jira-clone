'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { useProject } from '@/context/ProjectContext'
import directus from '@/lib/directus'

const PRIORITY_COLORS = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500"
}

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-red-100 text-red-800"
}

export default function TicketPage() {
  const params = useParams()
  const ticketId = Number(params.ticketId)
  const projectQuery = useProject()
  const projectId = projectQuery?.data?.id

  const { data: ticket } = useQuery({
    queryKey: ['projects', projectId, 'tickets', ticketId],
    queryFn: async () => {
      if (!projectId) return null
      const result = await directus.Tickets.query({
        filter: {
          id: ticketId,
          project: projectId,
        },
        fields: [
          'id',
          'title',
          'description',
          'status',
          'priority',
          'date_created',
          'date_updated',
          {
            user_created: ['first_name', 'last_name'],
          },
          {
            assignee: ['first_name', 'last_name'],
          }
        ]
      })
      return result?.[0]
    },
    enabled: !!projectId && !!ticketId,
  })

  if (!ticket) return null

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{ticket.title}</h1>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className={STATUS_COLORS[ticket.status]}>
            {ticket.status}
          </Badge>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[ticket.priority]}`} />
            <span className="text-sm">{ticket.priority}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {ticket.description || "No description provided"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium">Created By</dt>
                <dd className="text-sm text-muted-foreground">
                  {ticket.user_created ? 
                    `${ticket.user_created.first_name} ${ticket.user_created.last_name}` : 
                    'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Assigned To</dt>
                <dd className="text-sm text-muted-foreground">
                  {ticket.assignee ? 
                    `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 
                    'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Created</dt>
                <dd className="text-sm text-muted-foreground">
                  {ticket.date_created ? 
                    new Date(ticket.date_created).toLocaleDateString() : 
                    'Unknown'}
                </dd>
              </div>
              {ticket.date_updated && (
                <div>
                  <dt className="text-sm font-medium">Last Updated</dt>
                  <dd className="text-sm text-muted-foreground">
                    {new Date(ticket.date_updated).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}