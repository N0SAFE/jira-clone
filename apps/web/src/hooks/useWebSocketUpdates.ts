import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import directus from '@/lib/directus'

type WebSocketConfig = {
  collection: string
  showToast?: boolean
  onUpdate?: (item: any) => void
  query?: Record<string, any>
}

export function useWebSocketUpdates({ collection, showToast = true, onUpdate, query }: WebSocketConfig) {
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    async function setupWebSocket() {
      try {
        // Subscribe to collection changes
        const { subscription } = await directus.subscribe(collection, {
          query: query || { fields: ['*'] },
        })

        subscriptionRef.current = subscription

        // Process incoming updates
        ;(async () => {
          for await (const item of subscription) {
            if (showToast) {
              toast(`${collection} has been updated`, {
                description: `Item ${item.id} has been modified`,
              })
            }
            
            if (onUpdate) {
              onUpdate(item)
            }
          }
        })()

        // Setup WebSocket event listeners
        directus.onWebSocket('open', () => {
          console.log('WebSocket connection established')
        })

        directus.onWebSocket('message', (message) => {
          console.log('New WebSocket message:', message.type)
        })

        directus.onWebSocket('close', () => {
          console.log('WebSocket connection closed')
        })

        directus.onWebSocket('error', (error) => {
          console.error('WebSocket error:', error)
          toast.error('Connection error', {
            description: 'Failed to maintain real-time connection',
          })
        })
      } catch (error) {
        console.error('Failed to setup WebSocket:', error)
      }
    }

    setupWebSocket()

    // Cleanup subscription when component unmounts
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.return()
      }
    }
  }, [collection, showToast, onUpdate, query])
}