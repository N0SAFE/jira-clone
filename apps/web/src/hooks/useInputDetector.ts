import { useEffect, useState } from 'react'

type KeyBinding = {
    combinations?: { [key: string]: () => void }
    sequences?: { [key: string]: () => void }
    clicks?: {
        [key: string]: () => void // 'left', 'right', 'middle', etc.
    }
    clickWithKeys?: {
        [key: string]: () => void // format: 'left+ctrl+shift', 'right+alt', etc.
    }
    sequenceTimeout?: number
}

/**
 * Hook pour détecter des combinaisons de touches, des séquences de touches,
 * des clics de souris et des combinaisons clic+touches.
 *
 * @param keyBindings - Configuration des événements à détecter
 * @returns void
 */
const useInputDetector = (keyBindings: KeyBinding) => {
    const {
        combinations = {},
        sequences = {},
        clicks = {},
        clickWithKeys = {},
        sequenceTimeout = 2000,
    } = keyBindings

    // Pour suivre les touches actuellement enfoncées
    const [keysPressed, setKeysPressed] = useState<string[]>([])

    // Pour suivre les séquences de touches
    const [currentSequence, setCurrentSequence] = useState<string[]>([])
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Convertir les combinaisons en tableaux de touches
        const parsedCombinations = Object.entries(combinations).map(
            ([combo, callback]) => ({
                keys: combo.toLowerCase().split('+'),
                callback,
            })
        )

        // Convertir les séquences en tableaux de touches
        const parsedSequences = Object.entries(sequences).map(
            ([seq, callback]) => ({
                keys: seq.toLowerCase().split('>'),
                callback,
            })
        )

        // Convertir les combinaisons clic+touches
        const parsedClickWithKeys = Object.entries(clickWithKeys).map(
            ([combo, callback]) => ({
                parts: combo.toLowerCase().split('+'),
                callback,
            })
        )

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()

            // Mettre à jour les touches enfoncées
            if (!keysPressed.includes(key)) {
                const updatedKeys = [...keysPressed, key]
                setKeysPressed(updatedKeys)

                // Vérifier les combinaisons
                for (const combo of parsedCombinations) {
                    // Vérifier si toutes les touches de la combinaison sont enfoncées
                    const allKeysPressed = combo.keys.every((k) =>
                        k === 'control'
                            ? updatedKeys.includes('control') ||
                              updatedKeys.includes('ctrl')
                            : updatedKeys.includes(k)
                    )

                    // Vérifier si seules les touches de la combinaison sont enfoncées
                    const onlyComboKeysPressed =
                        updatedKeys.length === combo.keys.length

                    if (allKeysPressed && onlyComboKeysPressed) {
                        e.preventDefault()
                        combo.callback()
                        break
                    }
                }
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()

            // Mettre à jour les touches enfoncées
            setKeysPressed((prev) => prev.filter((k) => k !== key))

            // Ajouter à la séquence actuelle
            const newSequence = [...currentSequence, key]
            setCurrentSequence(newSequence)

            // Réinitialiser le timer existant
            if (timer) {
                clearTimeout(timer)
            }

            // Vérifier les séquences
            for (const seq of parsedSequences) {
                if (arraysEqual(newSequence, seq.keys)) {
                    seq.callback()
                    setCurrentSequence([])
                    return
                }
            }

            // Configurer un nouveau timer pour réinitialiser la séquence
            const newTimer = setTimeout(() => {
                setCurrentSequence([])
            }, sequenceTimeout)

            setTimer(newTimer)
        }

        // Gestionnaire de clics de souris
        const handleMouseClick = (e: MouseEvent) => {
            e.preventDefault()

            // Déterminer le type de clic
            let clickType: string
            switch (e.button) {
                case 0:
                    clickType = 'left'
                    break
                case 1:
                    clickType = 'middle'
                    break
                case 2:
                    clickType = 'right'
                    break
                default:
                    clickType = `button${e.button}`
            }

            // Vérifier les clics simples
            if (clicks[clickType]) {
                clicks[clickType]()
            }

            // Vérifier les combinaisons clic+touches
            for (const combo of parsedClickWithKeys) {
                // Le premier élément doit être le type de clic
                if (combo.parts[0] !== clickType) continue

                // Vérifier si toutes les touches requises sont enfoncées
                const requiredKeys = combo.parts.slice(1)
                const allKeysPressed = requiredKeys.every((k) =>
                    k === 'control'
                        ? keysPressed.includes('control') ||
                          keysPressed.includes('ctrl')
                        : keysPressed.includes(k)
                )

                if (allKeysPressed) {
                    combo.callback()
                    break
                }
            }
        }

        // Empêcher le menu contextuel par défaut
        const handleContextMenu = (e: MouseEvent) => {
            // Vérifier si nous avons un gestionnaire pour le clic droit
            if (
                clicks['right'] ||
                parsedClickWithKeys.some((combo) => combo.parts[0] === 'right')
            ) {
                e.preventDefault()
            }
        }

        // Fonction utilitaire pour comparer deux tableaux
        const arraysEqual = (a: string[], b: string[]) => {
            if (a.length !== b.length) return false
            return a.every((val, idx) => val === b[idx])
        }

        // Ajouter les écouteurs d'événements
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('mousedown', handleMouseClick)
        window.addEventListener('contextmenu', handleContextMenu)

        // Nettoyer les écouteurs d'événements
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('mousedown', handleMouseClick)
            window.removeEventListener('contextmenu', handleContextMenu)
            if (timer) {
                clearTimeout(timer)
            }
        }
    }, [
        combinations,
        sequences,
        clicks,
        clickWithKeys,
        keysPressed,
        currentSequence,
        timer,
        sequenceTimeout,
    ])
}

export default useInputDetector
