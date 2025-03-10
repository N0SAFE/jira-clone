import { useEffect, useRef, useCallback } from 'react'
import directus from '@/lib/directus'
import { toast } from "sonner"

type WebSocketOptions = {
  collection: string
  event?: 'create' | 'update' | 'delete'
  query?: Record<string, any>
  showToast?: boolean
  toastMessage?: (data: any) => string
}

export function useWebSocket(options: WebSocketOptions) {
  const subscriptionRef = useRef<any>(null)
  const { collection, event = 'create', query, showToast = false, toastMessage } = options

  const handleMessage = useCallback(async (subscription: any) => {
    try {
      for await (const item of subscription) {
        if (showToast && toastMessage) {
          toast(toastMessage(item))
        }
        console.log('WebSocket message:', item)
      }
    } catch (error) {
      console.error('WebSocket subscription error:', error)
    }
  }, [showToast, toastMessage])

  useEffect(() => {
    async function setupWebSocket() {
      try {
        // Subscribe to collection changes
        const { subscription } = await directus.subscribe(collection, {
          event,
          query,
        })

        subscriptionRef.current = subscription
        handleMessage(subscription)

        // Setup WebSocket event listeners
        directus.onWebSocket('open', () => {
          console.log('WebSocket connection opened')
        })

        directus.onWebSocket('message', (message) => {
          console.log('WebSocket message received:', message)
        })

        directus.onWebSocket('close', () => {
          console.log('WebSocket connection closed')
        })

        directus.onWebSocket('error', (error) => {
          console.error('WebSocket error:', error)
          toast.error('WebSocket connection error')
        })
      } catch (error) {
        console.error('Failed to setup WebSocket:', error)
        toast.error('Failed to setup real-time updates')
      }
    }

    setupWebSocket()

    return () => {
      // Cleanup subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current.return()
      }
    }
  }, [collection, event, query, handleMessage])

  // Function to create items through WebSocket
  const createItem = useCallback((data: any) => {
    directus.sendMessage({
      type: 'items',
      collection,
      action: 'create',
      data,
    })
  }, [collection])

  return { createItem }
}