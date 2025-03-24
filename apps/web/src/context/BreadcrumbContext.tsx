'use client'

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
    useRef,
    useEffect,
} from 'react'

export interface BreadcrumbItem {
    id: number
    label: string
    href?: string
}

interface BreadcrumbContextType {
    items: BreadcrumbItem[]
    addBreadcrumb: (item: Omit<BreadcrumbItem, 'id'>) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
    undefined
)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<BreadcrumbItem[]>([])
    const idCounterRef = useRef(0)

    // Create proper addBreadcrumb function that doesn't use hooks inside
    const addBreadcrumb = useCallback((item: Omit<BreadcrumbItem, 'id'>) => {
        const id = ++idCounterRef.current
        setItems(prev => {
            // Check if we already have an item with the same label and href
            const existingItemIndex = prev.findIndex(
                i => i.label === item.label && i.href === item.href
            )
            
            if (existingItemIndex >= 0) {
                // If item exists, no need to update state
                return prev
            }
            
            // Add new item
            return [...prev, { ...item, id }]
        })
    }, [])

    return (
        <BreadcrumbContext.Provider
            value={{
                items,
                addBreadcrumb,
            }}
        >
            {children}
        </BreadcrumbContext.Provider>
    )
}

export function useBreadcrumb() {
    const context = useContext(BreadcrumbContext)
    if (!context) {
        throw new Error(
            'useBreadcrumb must be used within a BreadcrumbProvider'
        )
    }
    return context
}
