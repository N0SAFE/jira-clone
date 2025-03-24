import { createContext, useContext, useEffect, ReactNode } from 'react'
import { toast } from "sonner"
import directus from '@/lib/directus'
import { Collections } from '@repo/directus-sdk/client'
import { useSession } from 'next-auth/react'

interface RealtimeContextType {
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeSubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) return

    // WebSocket event listeners
    directus.onWebSocket('open', () => {
      console.log('Realtime connection established')
      toast.success('Connected to real-time updates')
    })

    directus.onWebSocket('close', () => {
      console.log('Realtime connection closed')
      toast.error('Lost real-time connection')
    })

    directus.onWebSocket('error', (error) => {
      console.error('Realtime connection error:', error)
      toast.error('Real-time connection error')
    })

    // Subscribe to various collections
    const subscriptions = [
      // Projects updates
      directus.subscribe(Collections.Projects, {
        event: '*',
        query: { fields: ['*', { owner: ['id', 'first_name', 'last_name'] }] }
      }).then(({ subscription }) => {
        (async () => {
          for await (const item of subscription) {
            if (item.event === 'update') {
              toast.info(`Project "${item.data.name}" was updated`)
            } else if (item.event === 'create') {
              toast.success(`New project "${item.data.name}" was created`)
            } else if (item.event === 'delete') {
              toast.warning(`Project "${item.data.name}" was deleted`)
            }
          }
        })()
      }),

      // Tickets updates
      directus.subscribe(Collections.Tickets, {
        event: '*',
        query: { 
          fields: [
            '*',
            { 
              assignee: ['id', 'first_name', 'last_name'],
              status: ['id', 'name'],
              priority: ['id', 'name']
            }
          ]
        }
      }).then(({ subscription }) => {
        (async () => {
          for await (const item of subscription) {
            if (item.event === 'update') {
              const changes = []
              if (item.data.status) changes.push(`status changed to ${item.data.status.name}`)
              if (item.data.priority) changes.push(`priority changed to ${item.data.priority.name}`)
              if (item.data.assignee) changes.push(`assigned to ${item.data.assignee.first_name} ${item.data.assignee.last_name}`)
              
              if (changes.length > 0) {
                toast.info(`Ticket "${item.data.title}" ${changes.join(', ')}`)
              }
            } else if (item.event === 'create') {
              toast.success(`New ticket "${item.data.title}" was created`)
            } else if (item.event === 'delete') {
              toast.warning(`Ticket "${item.data.title}" was deleted`)
            }
          }
        })()
      }),

      // Team members updates
      directus.subscribe(Collections.ProjectsMembers, {
        event: '*',
        query: { 
          fields: ['*', { directus_user: ['id', 'first_name', 'last_name'] }]
        }
      }).then(({ subscription }) => {
        (async () => {
          for await (const item of subscription) {
            if (item.event === 'create' && item.data.directus_user) {
              const user = item.data.directus_user
              toast.success(`${user.first_name} ${user.last_name} joined the project`)
            } else if (item.event === 'delete' && item.data.directus_user) {
              const user = item.data.directus_user
              toast.warning(`${user.first_name} ${user.last_name} left the project`)
            }
          }
        })()
      })
    ]

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(sub => {
        sub.then(({ subscription }) => {
          subscription.return()
        })
      })
    }
  }, [session])

  return <RealtimeContext.Provider value={{ isConnected: true }}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeSubscriptionProvider')
  }
  return context
}