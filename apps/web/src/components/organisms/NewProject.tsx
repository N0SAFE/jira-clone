'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import { PenBoxIcon } from 'lucide-react'

export type NewProjectProps = {
    onSubmit: ({
        name,
        description,

        key,
    }: {
        name: string
        description: string
        key: string
    }) => void
    isPending: boolean
}

export const NewProject = ({ onSubmit, isPending }: NewProjectProps) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [key, setKey] = useState('')
    const [keyIsSetManually, setKeyIsSetManually] = useState(false)

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newKey = e.target.value
        setKey(newKey)
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value
        setName(newName)
        if (!keyIsSetManually) {
            const generatedKey = newName
                .toUpperCase()
                .replace(/\s+/g, '-')
                .slice(0, 3)
            setKey(generatedKey)
        }
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                onSubmit({ name, description, key })
            }}
            className="space-y-4"
        >
            <div className="flex items-center gap-2 ">
                <Input
                    value={key}
                    onChange={handleKeyChange}
                    placeholder="Project Key"
                    required
                    disabled={!keyIsSetManually}
                />
                <Button
                className="flex items-center justify-center"
                    type="button"
                    onClick={() => {
                        setKeyIsSetManually(true)
                    }}
                    variant={"outline"}
                >
                    <PenBoxIcon className="mr-2 h-4 w-4" />
                </Button>
            </div>

            <Input
                value={name}
                onChange={handleNameChange}
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
