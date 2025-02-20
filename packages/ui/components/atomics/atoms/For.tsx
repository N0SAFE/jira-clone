import { ReactNode, useMemo } from 'react'

type ForProps<T> = {
    each: T[]
    children: (item: T) => ReactNode
}

export default function For<T>({ each, children }: ForProps<T>) {
    return each.map((e) => children(e))
}
