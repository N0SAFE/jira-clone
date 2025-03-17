import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    DefaultError,
    DefinedInitialDataOptions,
    DefinedUseQueryResult,
    QueryClient,
    QueryKey,
    UndefinedInitialDataOptions,
    useQuery,
    useQueryClient,
    UseQueryOptions,
    UseQueryResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import directus from '@/lib/directus'
import { Schema } from '@repo/directus-sdk/client'

export type OptionsRealtimeOverload<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
> = {
    updater: (
        updateFn: (
            update:
                | TQueryFnData
                | ((old: TQueryFnData | undefined) => TQueryFnData)
        ) => void,
        options: {
            abortSignal: AbortSignal
        }
    ) => TQueryFnData
    queryFn?: never
    debug?: boolean
    onError?: (error: Error) => void
    retryOnReconnect?: boolean
}

export function useRealtimeQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
        OptionsRealtimeOverload<TQueryFnData, TError, TData, TQueryKey>,
    queryClient?: QueryClient
): DefinedUseQueryResult<TData, TError>
export function useRealtimeQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    options: UndefinedInitialDataOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey
    > &
        OptionsRealtimeOverload<TQueryFnData, TError, TData, TQueryKey>,
    queryClient?: QueryClient
): UseQueryResult<TData, TError>
export function useRealtimeQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> &
        OptionsRealtimeOverload<TQueryFnData, TError, TData, TQueryKey>,
    queryClient?: QueryClient
): UseQueryResult<TData, TError>

export function useRealtimeQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
>(
    options: (
        | DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
        | UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
        | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    ) &
        OptionsRealtimeOverload<TQueryFnData, TError, TData, TQueryKey>,
    queryClient?: QueryClient
): DefinedUseQueryResult<TData, TError> | UseQueryResult<TData, TError> {
    const {
        updater,
        debug = false,
        onError,
        retryOnReconnect = false,
        ...rest
    } = options
    const queryClientInstance = queryClient ?? useQueryClient()
    const [abortController] = useState<AbortController>(new AbortController())
    const [initialData, setInitialData] = useState<TQueryFnData | undefined>(
        undefined
    )
    const [error, setError] = useState<Error | null>(null)

    const log = useCallback(
        (message: string, data?: any) => {
            if (debug) {
                console.log(`[useRealtimeQuery] ${message}`, data || '')
            }
        },
        [debug]
    )

    // Correction de la fonction de mise à jour pour être compatible avec les types de React Query
    const updateQueryData = useCallback(
        (
            update:
                | TQueryFnData
                | ((old: TQueryFnData | undefined) => TQueryFnData)
        ) => {
            log('updating data', update)

            // Utiliser l'API typée correctement de React Query
            queryClientInstance.setQueryData<TQueryFnData>(
                rest.queryKey,
                (oldData) => {
                    if (typeof update === 'function') {
                        // Cast explicite pour satisfaire TypeScript
                        return (
                            update as (
                                old: TQueryFnData | undefined
                            ) => TQueryFnData
                        )(oldData)
                    }
                    return update
                }
            )
        },
        [queryClientInstance, rest.queryKey, log]
    )

    // Reste du code...
    // ...

    // Fonction pour initialiser les données
    const initializeData = useCallback(() => {
        try {
            const data = updater(updateQueryData, {
                abortSignal: abortController.signal,
            })
            setInitialData(data)
            setError(null)
            return data
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            log('Error in updater', error)
            setError(error)
            if (onError) {
                onError(error)
            }
            throw error
        }
    }, [updater, updateQueryData, abortController, onError, log])

    // Initialisation et nettoyage
    useEffect(() => {
        log('Initializing updater')
        initializeData()

        return () => {
            log('Cleaning up updater')
            abortController.abort()
        }
    }, [initializeData, abortController, log])

    // Utiliser React Query avec les données initiales
    return useQuery({
        ...rest,
        queryFn: async () => {
            if (error) throw error
            if (initialData === undefined) {
                return initializeData()
            }
            return initialData
        },
    })
}

// Modifier la définition du type pour utiliser readonly unknown[]
type DirectusRealtimeConfig<T> = {
    collection: keyof Schema
    queryKey: readonly unknown[] // Changement ici: readonly unknown[] au lieu de unknown[]
    showToast?: boolean
    toastMessages?: {
        create?: (item: any) => string
        update?: (item: any) => string
        delete?: (item: any) => string
    }
    initialData?: T
    queryOptions?: Omit<UseQueryOptions<T, Error, T, readonly unknown[]>, 'queryKey' | 'queryFn'>
}

export function useDirectusRealtime<T>({
    collection,
    queryKey,
    showToast = false,
    toastMessages = {},
    initialData,
    queryOptions = {}
}: DirectusRealtimeConfig<T>) {
    // Utilisez useRealtimeQuery avec les types corrects
    return useRealtimeQuery<T, Error, T, readonly unknown[]>({ // Ajout du paramètre générique explicite
        queryKey, // queryKey est maintenant de type readonly unknown[]
        
        updater: (updateFn, { abortSignal }) => {
            console.log(`Setting up WebSocket connection for ${collection}`)
            
            // Configurer les événements WebSocket
            directus.onWebSocket('open', () => {
                console.log(`WebSocket connection opened for ${collection}`)
            })

            directus.onWebSocket('error', (error) => {
                console.error(`WebSocket error for ${collection}:`, error)
                if (showToast) {
                    toast.error(`Connection error for ${collection}`)
                }
            })

            directus.onWebSocket('close', () => {
                console.log(`WebSocket connection closed for ${collection}`)
            })
            
            // Fonction pour configurer l'abonnement
            const setupSubscription = async () => {
                try {
                    const { subscription } = await directus.subscribe(collection, {
                        query: { fields: ['*'] },
                    });
                    
                    // Traiter les événements d'abonnement
                    (async () => {
                        try {
                            for await (const item of subscription) {
                                console.log(`Received ${collection} update:`, item)
                                
                                // Mettre à jour les données en fonction du type d'événement
                                switch (item.event) {
                                    case 'create':
                                        updateFn((currentData: T | undefined) => {
                                            // Pour les tableaux, ajouter le nouvel élément
                                            if (Array.isArray(currentData)) {
                                                return [...(currentData || []), item.data] as T
                                            }
                                            // Pour les objets uniques, remplacer
                                            return item.data as T
                                        })
                                        
                                        if (showToast && toastMessages.create) {
                                            toast.success(toastMessages.create(item.data))
                                        }
                                        break
                                        
                                    case 'update':
                                        updateFn((currentData: T | undefined) => {
                                            // Pour les tableaux, mettre à jour l'élément correspondant
                                            if (Array.isArray(currentData)) {
                                                return (currentData || []).map((record: any) => 
                                                    record.id === item.data.id ? { ...record, ...item.data } : record
                                                ) as T
                                            }
                                            // Pour les objets uniques, mettre à jour
                                            return { ...(currentData || {}), ...item.data } as T
                                        })
                                        
                                        if (showToast && toastMessages.update) {
                                            toast.info(toastMessages.update(item.data))
                                        }
                                        break
                                        
                                    case 'delete':
                                        updateFn((currentData: T | undefined) => {
                                            // Pour les tableaux, supprimer l'élément
                                            if (Array.isArray(currentData)) {
                                                return (currentData || []).filter((record: any) => 
                                                    record.id !== item.data.id
                                                ) as T
                                            }
                                            // Pour les objets uniques, retourner null ou un état par défaut
                                            return null as unknown as T
                                        })
                                        
                                        if (showToast && toastMessages.delete) {
                                            toast.warning(toastMessages.delete(item.data))
                                        }
                                        break
                                }
                            }
                        } catch (error) {
                            console.error(`Subscription processing error for ${collection}:`, error)
                        }
                    })()
                    
                } catch (error) {
                    console.error(`Failed to subscribe to ${collection}:`, error)
                    throw error
                }
            }
            
            // Démarrer l'abonnement
            setupSubscription().catch(console.error)
            
            // Nettoyer lors de l'annulation
            abortSignal.addEventListener('abort', () => {
                console.log(`Cleaning up WebSocket subscription for ${collection}`)
                // Ici, vous pourriez ajouter la logique de désabonnement quand elle sera disponible dans Directus
            })
            
            // Retourner les données initiales
            return initialData as T || (Array.isArray(initialData) ? [] : {}) as T
        },
        
        // Options supplémentaires
        debug: true,
        retryOnReconnect: true,
        
        // Fusionner avec les options de requête personnalisées
        ...queryOptions
    })
}