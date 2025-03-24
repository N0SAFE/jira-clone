import { useState, useEffect } from 'react'
import directus from '@/lib/directus'
import { toast } from 'sonner'
import { Collections } from '@repo/directus-sdk/client'

type EventType = 'create' | 'update' | 'delete'
type SubscriptionOptions = {
  collection: keyof Collections
  event: EventType
  query?: Record<string, any>
  showToast?: boolean
  toastMessage?: (data: any) => string
}

export function useWebSocketSubscription({
  collection,
  event,
  query,
  showToast = false,
  toastMessage,
}: SubscriptionOptions) {
  const [error, setError] = useState<Error | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function setupSubscription() {
      try {
        const { subscription } = await directus.subscribe(collection, {
          event,
          query,
        })

        // Handle WebSocket events
        directus.onWebSocket('open', () => {
          if (isMounted) {
            setIsConnected(true)
            console.log('WebSocket connection established')
          }
        })

        directus.onWebSocket('close', () => {
          if (isMounted) {
            setIsConnected(false)
            console.log('WebSocket connection closed')
          }
        })

        directus.onWebSocket('error', (error) => {
          if (isMounted) {
            setError(error)
            console.error('WebSocket error:', error)
          }
        })

        // Subscribe to updates
        for await (const item of subscription) {
          if (isMounted) {
            console.log(`${event} event received for ${collection}:`, item)
            
            if (showToast && toastMessage) {
              toast(toastMessage(item))
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          console.error('Subscription error:', err)
        }
      }
    }

    setupSubscription()

    return () => {
      isMounted = false
    }
  }, [collection, event, query, showToast, toastMessage])

  return { isConnected, error }
}