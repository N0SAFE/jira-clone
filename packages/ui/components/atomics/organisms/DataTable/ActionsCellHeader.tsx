import { Button } from '@repo/ui/components/shadcn/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@repo/ui/components/shadcn/dropdown-menu'
import { Promisable } from '@repo/types/utils'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import React from 'react'

type DefaultColumnOptions<T> = {
    onRowDelete?: (rows: T[]) => Promisable<void>
    onRowEdit?: (rows: T[]) => Promisable<void>
    onRowView?: (rows: T[]) => Promisable<void>
}

type ActionsCellHeaderProps<T, O extends DefaultColumnOptions<T>> = {
    rows: Row<T>[]
    options?: O
}

export function ActionsCellHeader<T, O extends DefaultColumnOptions<T>>({
    rows,
    options,
}: ActionsCellHeaderProps<T, O>) {
    const [actionsDropdownIsOpen, setActionsDropdownIsOpen] =
        React.useState(false)

    return (
        <div className="flex justify-end">
            <DropdownMenu
                open={actionsDropdownIsOpen}
                onOpenChange={setActionsDropdownIsOpen}
            >
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={async (e) => {
                            e.preventDefault()
                            await options?.onRowView?.(
                                rows.map((row) => row.original)
                            )
                            setActionsDropdownIsOpen(false)
                        }}
                    >
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={async (e) => {
                            e.preventDefault()
                            await options?.onRowEdit?.(
                                rows.map((row) => row.original)
                            )
                            setActionsDropdownIsOpen(false)
                        }}
                    >
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer bg-red-600 text-white hover:bg-red-500"
                        onClick={async (e) => {
                            e.preventDefault()
                            await options?.onRowDelete?.(
                                rows.map((row) => row.original)
                            )
                            setActionsDropdownIsOpen(false)
                        }}
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
