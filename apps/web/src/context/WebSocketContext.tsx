'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { toast } from "sonner"
import directus from '@/lib/directus'
import { useSession } from 'next-auth/react'

type WebSocketContextType = {
  connected: boolean
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false
})

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = React.useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    // Setup WebSocket event listeners
    directus.onWebSocket('open', () => {
      console.log('WebSocket connection established')
      setIsConnected(true)
      toast.success('Connected to real-time updates')
    })

    directus.onWebSocket('message', (message) => {
      console.log('New WebSocket message:', message)
      if (message.type === 'items' && message.collection) {
        const { collection, action, data } = message
        
        // Handle different types of updates with appropriate toast notifications
        switch (action) {
          case 'create':
            if (collection === 'tickets') {
              toast.info(`New ticket created: ${data.title}`)
            } else if (collection === 'projects') {
              toast.info(`New project created: ${data.name}`)
            }
            break
          case 'update':
            if (collection === 'tickets') {
              toast.info(`Ticket updated: ${data.title}`)
            } else if (collection === 'projects') {
              toast.info(`Project updated: ${data.name}`)
            }
            break
          case 'delete':
            if (collection === 'tickets') {
              toast.warning(`Ticket deleted`)
            } else if (collection === 'projects') {
              toast.warning(`Project deleted`)
            }
            break
        }
      }
    })

    directus.onWebSocket('close', () => {
      console.log('WebSocket connection closed')
      setIsConnected(false)
      toast.error('Disconnected from real-time updates')
    })

    directus.onWebSocket('error', (error) => {
      console.error('WebSocket error:', error)
      toast.error('Error in real-time connection')
    })

    // Subscribe to relevant collections
    const subscribeToCollections = async () => {
      try {
        // Subscribe to tickets collection
        const ticketsSubscription = await directus.subscribe('tickets', {
          event: '*', // Listen to all events (create, update, delete)
          query: {
            fields: ['*', 'owner.*', 'status.*', 'priority.*', 'type.*']
          }
        })

        // Subscribe to projects collection
        const projectsSubscription = await directus.subscribe('projects', {
          event: '*',
          query: {
            fields: ['*', 'owner.*', 'members.*']
          }
        })

        // Handle ticket updates
        ;(async () => {
          for await (const item of ticketsSubscription) {
            console.log('Ticket update:', item)
          }
        })()

        // Handle project updates
        ;(async () => {
          for await (const item of projectsSubscription) {
            console.log('Project update:', item)
          }
        })()
      } catch (error) {
        console.error('Error subscribing to collections:', error)
        toast.error('Failed to subscribe to updates')
      }
    }

    subscribeToCollections()

    // Cleanup function
    return () => {
      // Any cleanup needed when the component unmounts
      directus.disconnect()
    }
  }, [session?.user?.id])

  return (
    <WebSocketContext.Provider value={{ connected: isConnected }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => useContext(WebSocketContext)