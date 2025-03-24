import { useEffect, useRef, RefObject } from 'react'

type Binding = (e: MouseEvent | KeyboardEvent) => void

interface InputBindings {
    [key: string]: Binding
    sequenceTimeout?: number
}

type PatternNode = {
    type: 'combination' | 'sequence' | 'click' | 'key' | 'or'
    value?: string
    parts?: PatternNode[]
}

/**
 * Parse a pattern string into a tree structure
 * Handles patterns like:
 * - "p+a" (combination)
 * - "p>a" (sequence)
 * - "(p+a)|(p+b)" (OR condition)
 * - "(ctrl+a)|(shift+b)" (complex OR with combinations)
 * - "click(left)" (mouse click)
 */
function parsePattern(pattern: string): PatternNode {
    pattern = pattern.trim()

    // Handle parentheses first
    if (pattern.startsWith('(') && pattern.endsWith(')')) {
        pattern = pattern.slice(1, -1)
    }

    // Handle OR conditions
    if (pattern.includes('|')) {
        return {
            type: 'or',
            parts: pattern.split('|').map(p => parsePattern(p.trim()))
        }
    }

    // Handle sequences (separated by >)
    if (pattern.includes('>')) {
        return {
            type: 'sequence',
            parts: pattern.split('>').map(p => parsePattern(p.trim()))
        }
    }

    // Handle combinations (separated by +)
    if (pattern.includes('+')) {
        return {
            type: 'combination',
            parts: pattern.split('+').map(p => parsePattern(p.trim()))
        }
    }

    // Handle mouse clicks
    if (pattern.startsWith('click(')) {
        const button = pattern.match(/click\((.*?)\)/)?.[1]
        return {
            type: 'click',
            value: button || ''
        }
    }

    // Single key
    return {
        type: 'key',
        value: pattern.toLowerCase()
    }
}

/**
 * Evaluates if a pattern matches the current input state
 */
function matchesPattern(
    pattern: PatternNode, 
    currentState: { 
        pressedKeys: Set<string>,
        currentClick?: string 
    }
): boolean {
    switch (pattern.type) {
        case 'or':
            return pattern.parts?.some(p => matchesPattern(p, currentState)) || false

        case 'combination':
            return pattern.parts?.every(p => {
                if (p.type === 'click') {
                    return currentState.currentClick === p.value
                }
                if (p.type === 'key') {
                    const key = p.value === 'control' ? 'ctrl' : p.value
                    return currentState.pressedKeys.has(key)
                }
                return false
            }) || false

        case 'click':
            return currentState.currentClick === pattern.value

        case 'key':
            const key = pattern.value === 'control' ? 'ctrl' : pattern.value
            return currentState.pressedKeys.has(key || '')

        default:
            return false
    }
}

/**
 * Hook to detect complex input patterns on a specific element.
 * Supports combinations, sequences, and nested OR conditions.
 */
const useElementInputDetector = <T extends HTMLElement | null>(
    elementRef: RefObject<T>,
    config: { bindings: InputBindings }
) => {
    const { bindings } = config
    const pressedKeys = useRef(new Set<string>())
    const currentClick = useRef<string | undefined>()

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        const parsedBindings = new Map(
            Object.entries(bindings)
                .filter(([key]) => key !== 'sequenceTimeout')
                .map(([pattern, callback]) => [
                    parsePattern(pattern),
                    callback
                ])
        )

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            pressedKeys.current.add(key)

            // Check patterns
            for (const [pattern, callback] of parsedBindings) {
                if (matchesPattern(pattern, { 
                    pressedKeys: pressedKeys.current,
                    currentClick: currentClick.current
                })) {
                    callback(e)
                }
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            pressedKeys.current.delete(key)
        }

        const handleMouseDown = (e: MouseEvent) => {
            let clickType: string
            switch (e.button) {
                case 0: clickType = 'left'; break
                case 1: clickType = 'middle'; break
                case 2: clickType = 'right'; break
                default: clickType = `button${e.button}`
            }

            currentClick.current = clickType

            // Check patterns
            for (const [pattern, callback] of parsedBindings) {
                if (matchesPattern(pattern, { 
                    pressedKeys: pressedKeys.current,
                    currentClick: clickType
                })) {
                    callback(e)
                }
            }
        }

        const handleMouseUp = () => {
            currentClick.current = undefined
        }

        // Prevent default context menu if we have right click handlers
        const handleContextMenu = (e: MouseEvent) => {
            for (const [pattern] of parsedBindings) {
                if (matchesPattern(pattern, { 
                    pressedKeys: pressedKeys.current,
                    currentClick: 'right'
                })) {
                    e.preventDefault()
                    break
                }
            }
        }

        element.addEventListener('keydown', handleKeyDown)
        element.addEventListener('keyup', handleKeyUp)
        element.addEventListener('mousedown', handleMouseDown)
        element.addEventListener('mouseup', handleMouseUp)
        element.addEventListener('contextmenu', handleContextMenu)

        return () => {
            element.removeEventListener('keydown', handleKeyDown)
            element.removeEventListener('keyup', handleKeyUp)
            element.removeEventListener('mousedown', handleMouseDown)
            element.removeEventListener('mouseup', handleMouseUp)
            element.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [elementRef, bindings])
}

export default useElementInputDetector
