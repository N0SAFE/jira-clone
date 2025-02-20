'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'

export type NewProjectProps = {
    onSubmit: ({
        name,
        description,
    }: {
        name: string
        description: string
    }) => void
    isPending: boolean
}

export const NewProject = ({ onSubmit, isPending }: NewProjectProps) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                onSubmit({ name, description })
            }}
            className="space-y-4"
        >
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project Name"
                required
            />
            <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project Description"
                required
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Project'}
            </Button>
        </form>
    )
}
