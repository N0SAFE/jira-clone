import { useState, useCallback } from 'react';
import directus from '@/lib/directus';

export function useEditableField<T>(
    ticketId: number,
    field: string,
    initialValue: T,
    onSuccess?: () => void
) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState<T>(initialValue);
    const [isLoading, setIsLoading] = useState(false);

    const startEditing = useCallback(() => {
        setIsEditing(true);
    }, []);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        setValue(initialValue);
    }, [initialValue]);

    const saveChanges = useCallback(async (newValue: T) => {
        setIsLoading(true);
        try {
            await directus.Ticket.update(ticketId, {
                [field]: newValue
            });
            setValue(newValue);
            setIsEditing(false);
            onSuccess?.();
        } catch (error) {
            console.error('Failed to update ticket:', error);
        } finally {
            setIsLoading(false);
        }
    }, [ticketId, field, onSuccess]);

    return {
        isEditing,
        isLoading,
        value,
        startEditing,
        cancelEditing,
        saveChanges
    };
}