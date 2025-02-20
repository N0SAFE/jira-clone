import { DataTableColumnHeader } from '@repo/ui/components/atomics/organisms/DataTable/DataTableColumnHeader'
import { Checkbox } from '@repo/ui/components/shadcn/checkbox'
import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/shadcn/avatar'
import { ActionsCellRow } from '@repo/ui/components/atomics/organisms/DataTable/ActionsCellRow'
import { ActionsCellHeader } from '@repo/ui/components/atomics/organisms/DataTable/ActionsCellHeader'
import { Promisable } from '@repo/types/utils'
import { Collections } from '@repo/directus-sdk/client'
import { ApplyFields } from '@repo/directus-sdk/indirectus/utils'
import { DirectusFile } from '@repo/ui/components/atomics/atoms/Directus/DirectusFile'
import directus from '@/lib/directus'

export type DType = ApplyFields<
    Collections.Projects,
    [
        'id',
        'name',
        {
            owner: ['id', 'avatar', 'first_name', 'last_name']
        },
    ]
>

export type ColumnOptions = {
    accessToken?: string
}

export const useColumns = (options?: ColumnOptions) => {
    const columns: ColumnDef<DType>[] = [
        // {
        //     id: 'select',
        //     header: ({ table }) => (
        //         <Checkbox
        //             checked={
        //                 table.getIsAllPageRowsSelected() ||
        //                 (table.getIsSomePageRowsSelected() && 'indeterminate')
        //             }
        //             onCheckedChange={(value: boolean) =>
        //                 table.toggleAllPageRowsSelected(!!value)
        //             }
        //             aria-label="Select all"
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             checked={row.getIsSelected()}
        //             onCheckedChange={(value: boolean) =>
        //                 row.toggleSelected(!!value)
        //             }
        //             aria-label="Select row"
        //         />
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },
        {
            accessorKey: 'id',
            header: ({ column }) => {
                return <DataTableColumnHeader column={column} title="Id" />
            },
            cell: ({ row }) => <div>{row.original.id}</div>,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => {
                return <DataTableColumnHeader column={column} title="Name" />
            },
            cell: ({ row }) => (
                <div className="font-medium">{row.original.name}</div>
            ),
        },
        {
            accessorKey: 'owner',
            header: ({ column }) => {
                return <DataTableColumnHeader column={column} title="Owner" />
            },
            cell: ({ row }) => {
                const owner = row.original.owner
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <DirectusFile
                                directus={directus}
                                asset={owner?.avatar}
                                accessToken={options?.accessToken}
                                render={({ url }) => {
                                    return (
                                        <AvatarImage
                                            src={url}
                                            alt={owner?.first_name || 'User'}
                                        />
                                    )
                                }}
                            />
                            <AvatarFallback>
                                {owner?.first_name?.[0]?.toUpperCase() ?? 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span>
                            {owner?.first_name} {owner?.last_name}
                        </span>
                    </div>
                )
            },
        },
        // {
        //     id: 'actions',
        //     enableHiding: false,
        //     header: ({ table }) => {
        //         if (
        //             table.getIsSomeRowsSelected() ||
        //             table.getIsAllRowsSelected()
        //         ) {
        //             return (
        //                 <ActionsCellHeader
        //                     rows={table.getSelectedRowModel().rows}
        //                     options={options}
        //                 />
        //             )
        //         }
        //         return null
        //     },
        //     cell: (cellContext): React.ReactNode => {
        //         return (
        //             <ActionsCellRow row={cellContext.row} options={options} />
        //         )
        //     },
        // },
    ]
    return columns
}
