import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import directus from '@/lib/directus'
import type { Schema } from '@repo/directus-sdk/client'

type WebSocketConfig = {
    collection: keyof Schema
    showToast?: boolean
    onItemCreated?: (item: any) => void
    onItemUpdated?: (item: any) => void
    onItemDeleted?: (item: any) => void
    query?: Record<string, any>
}

/**
 * Hook to handle WebSocket connections and notifications for a Directus collection
 */
export function useWebSocketNotifications(config: WebSocketConfig) {
    const [isConnected, setIsConnected] = useState(false)
    const [reconnectAttempt, setReconnectAttempt] = useState(0)
    const MAX_RECONNECT_ATTEMPTS = 5

    const handleWebSocketMessage = useCallback(async (subscription: any) => {
        try {
            for await (const message of subscription) {
                if (!message) continue

                const { event, payload } = message

                switch (event) {
                    case 'create':
                        if (config.showToast) {
                            toast.success(`New ${String(config.collection)} item created`, {
                                description: 'The data has been updated automatically'
                            })
                        }
                        config.onItemCreated?.(payload)
                        break

                    case 'update':
                        if (config.showToast) {
                            toast.info(`${String(config.collection)} item updated`, {
                                description: 'The data has been updated automatically'
                            })
                        }
                        config.onItemUpdated?.(payload)
                        break

                    case 'delete':
                        if (config.showToast) {
                            toast.warning(`${String(config.collection)} item deleted`, {
                                description: 'The data has been updated automatically'
                            })
                        }
                        config.onItemDeleted?.(payload)
                        break
                }
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error)
        }
    }, [config])

    useEffect(() => {
        let subscription: any
        let reconnectTimeout: NodeJS.Timeout
        const cleanupListeners: (() => void)[] = []

        async function initializeSubscription() {
            try {
                // Set up general WebSocket event handlers
                const openHandler = () => {
                    console.log(`WebSocket connection opened for ${String(config.collection)}`)
                    setIsConnected(true)
                    setReconnectAttempt(0) // Reset reconnect attempts on successful connection
                }
                directus.onWebSocket('open', openHandler)
                cleanupListeners.push(() => directus.onWebSocket('open', openHandler))

                const closeHandler = () => {
                    console.log(`WebSocket connection closed for ${String(config.collection)}`)
                    setIsConnected(false)
                    
                    // Attempt to reconnect if not at max attempts
                    if (reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
                        reconnectTimeout = setTimeout(() => {
                            setReconnectAttempt(prev => prev + 1)
                            initializeSubscription()
                        }, Math.min(1000 * Math.pow(2, reconnectAttempt), 30000)) // Exponential backoff with 30s max
                    } else {
                        toast.error('Connection lost', {
                            description: 'Failed to reconnect after multiple attempts'
                        })
                    }
                }
                directus.onWebSocket('close', closeHandler)
                cleanupListeners.push(() => directus.onWebSocket('close', closeHandler))

                const errorHandler = (error: any) => {
                    console.error(`WebSocket error for ${String(config.collection)}:`, error)
                    toast.error('Connection error', {
                        description: 'An error occurred with the real-time connection'
                    })
                }
                directus.onWebSocket('error', errorHandler)
                cleanupListeners.push(() => directus.onWebSocket('error', errorHandler))

                // Subscribe to collection changes
                const { subscription: newSubscription } = await directus.subscribe(config.collection as keyof Schema, {
                    event: '*', // Listen to all events (create, update, delete)
                    query: config.query
                })

                subscription = newSubscription
                handleWebSocketMessage(subscription)

            } catch (error) {
                console.error(`Error initializing WebSocket for ${String(config.collection)}:`, error)
                toast.error('Connection error', {
                    description: 'Failed to initialize real-time updates'
                })
            }
        }

        initializeSubscription()

        // Cleanup subscription and event listeners on unmount
        return () => {
            if (subscription) {
                subscription.return()
            }
            clearTimeout(reconnectTimeout)
            
            // Clean up WebSocket event listeners
            cleanupListeners.forEach(cleanup => cleanup())
        }
    }, [config, handleWebSocketMessage, reconnectAttempt])

    return { isConnected }
}