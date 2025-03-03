import { useState, useEffect, useRef } from 'react'
import { Input } from '@repo/ui/components/shadcn/input'
import { Textarea } from '@repo/ui/components/shadcn/textarea'
import { Button } from '@repo/ui/components/shadcn/button'
import { Check, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/shadcn/select'
import { cn } from '@/lib/utils'

interface EditableFieldProps {
    value: any
    onSave: (value: any) => Promise<void>
    type?: 'text' | 'textarea' | 'select'
    selectOptions?: { value: string; label: string }[]
    className?: string
    placeholder?: string
}

export function EditableField({
    value,
    onSave,
    type = 'text',
    selectOptions = [],
    className,
    placeholder = 'Click to edit...'
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(value)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    useEffect(() => {
        setEditValue(value)
    }, [value])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isEditing])

    const handleSave = async () => {
        try {
            setIsSaving(true)
            await onSave(editValue)
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to save:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setEditValue(value)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSave()
        } else if (e.key === 'Escape') {
            handleCancel()
        }
    }

    if (isEditing) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                {type === 'textarea' ? (
                    <Textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="min-h-[100px]"
                    />
                ) : type === 'select' ? (
                    <Select
                        value={editValue}
                        onValueChange={(value) => {
                            setEditValue(value)
                            // Auto-save for select fields
                            onSave(value)
                            setIsEditing(false)
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {selectOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                    />
                )}
                {type !== 'select' && (
                    <>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>
        )
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "cursor-pointer rounded-sm px-1 py-0.5 hover:bg-muted/50 transition-colors",
                !value && "text-muted-foreground italic",
                className
            )}
        >
            {value || placeholder}
        </div>
    )
}