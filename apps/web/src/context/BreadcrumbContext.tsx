'use client'

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
    useEffect,
    useRef,
} from 'react'

export interface BreadcrumbItem {
    id: number
    label: string
    href?: string
}

interface BreadcrumbContextType {
    items: BreadcrumbItem[]
    useAddBreadcrumb: (item: Omit<BreadcrumbItem, 'id'>) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
    undefined
)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<BreadcrumbItem[]>([])

    const useAddBreadcrumb = useCallback((item: Omit<BreadcrumbItem, 'id'>) => {
        const id = useRef(Math.random())
        setItems((prev) =>
            prev.some((i) => i.id === id.current)
                ? prev.map((i) =>
                      i.id === id.current ? { ...item, id: id.current } : i
                  )
                : [...prev, { ...item, id: id.current }]
        )
    }, [])

    return (
        <BreadcrumbContext.Provider
            value={{
                items,
                useAddBreadcrumb,
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
