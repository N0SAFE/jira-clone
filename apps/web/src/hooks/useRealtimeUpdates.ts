import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import directus from '@/lib/directus'

type RealtimeConfig = {
  collection: string
  queryKey: string[]
  showToast?: boolean
  toastMessages?: {
    create?: (item: any) => string
    update?: (item: any) => string
    delete?: (item: any) => string
  }
}

export function useRealtimeUpdates({
  collection,
  queryKey,
  showToast = false,
  toastMessages = {},
}: RealtimeConfig) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Setup WebSocket event listeners
    directus.onWebSocket('open', () => {
      console.log(`WebSocket connection opened for ${collection}`)
    })

    directus.onWebSocket('error', (error) => {
      console.error(`WebSocket error for ${collection}:`, error)
      toast.error(`Connection error for ${collection}`)
    })

    directus.onWebSocket('close', () => {
      console.log(`WebSocket connection closed for ${collection}`)
    })

    // Subscribe to collection changes
    const setupSubscription = async () => {
      const { subscription } = await directus.subscribe(collection, { 
        query: { fields: ['*'] }
      })

      // Listen for all events on the subscription
      for await (const item of subscription) {
        console.log(`Received ${collection} update:`, item)
        
        // Invalidate the related query to trigger a refetch
        queryClient.invalidateQueries({ queryKey })

        // Show toast notification if enabled
        if (showToast) {
          switch (item.event) {
            case 'create':
              if (toastMessages.create) {
                toast.success(toastMessages.create(item.data))
              }
              break
            case 'update':
              if (toastMessages.update) {
                toast.info(toastMessages.update(item.data))
              }
              break
            case 'delete':
              if (toastMessages.delete) {
                toast.warning(toastMessages.delete(item.data))
              }
              break
          }
        }
      }
    }

    setupSubscription().catch(console.error)

    // Cleanup subscription on component unmount
    return () => {
      // Note: Directus SDK currently doesn't provide a way to unsubscribe
      // This is a placeholder for when that functionality becomes available
      console.log(`Cleaning up WebSocket subscription for ${collection}`)
    }
  }, [collection, queryKey, showToast, toastMessages])
}