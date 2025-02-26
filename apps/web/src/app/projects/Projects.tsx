'use client'

import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { BoardHeader } from '@/components/organisms/BoardHeader'
import { ProjectsProjectId } from '@/routes'
import { NewProject } from '@/components/organisms/NewProjectModal'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/ui/components/shadcn/dialog'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { DType, useColumns } from './columns'
import useTableRef from '@repo/ui/hooks/useTableRef'
import { DataTablePagination } from '@repo/ui/components/atomics/organisms/DataTable/DataTablePagination'
import { DataTableProvider } from '@repo/ui/components/atomics/organisms/DataTable/DataTableContext'
import { DataTable } from '@repo/ui/components/atomics/organisms/DataTable'
import { TableCell, TableRow } from '@repo/ui/components/shadcn/table'
import { flexRender } from '@tanstack/react-table'
import directus from '@/lib/directus'
import { ApplyFields } from '@repo/directus-sdk/utils'
import { Collections } from '@repo/directus-sdk/client'

export function Projects() {
    const queryClient = useQueryClient()

    const { data: session } = useSession()

    const {
        data: projects,
        isFetched,
        isPlaceholderData,
    } = useQuery({
        queryKey: ['projects', session?.user.id],
        queryFn: () =>
            directus.Projects.query({
                filter: {
                    user_created: {
                        _contains: session?.user.id,
                    },
                },
                fields: [
                    'id',
                    'name',
                    {
                        owner: ['id', 'avatar', 'first_name', 'last_name'],
                    },
                ],
            }),
    })

    const projectMutation = useMutation({
        mutationFn: (
            newProject: Pick<
                ApplyFields<Collections.Projects>,
                'name' | 'description'
            >
        ) =>
            directus.Project.create({
                ...newProject,
                owner: session?.user.id,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return query.queryKey[0] === 'projects'
                },
            })
            setIsDialogOpen(false)
        },
    })

    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const tableRef = useTableRef<DType>()

    const columns = useColumns({
        accessToken: session?.access_token,
    })

    return (
        <div className="space-y-4 p-8 pt-6">
            <BoardHeader>
                <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit profile</DialogTitle>
                            <DialogDescription>
                                Make changes to your profile here. Click save
                                when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <NewProject
                                onSubmit={projectMutation.mutate}
                                isPending={projectMutation.isPending}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </BoardHeader>

            <DataTableProvider
                columns={columns}
                data={projects ?? []}
                tableRef={tableRef}
                // tableOptions={{ // @flag server-side-pagination
                //     manualPagination: true,
                //     rowCount: context?.paginator?.total,
                //     state: {
                //         pagination: pagination,
                //     },
                //     onPaginationChange: async (udpater) => {
                //         setPagination((last) =>
                //             functionalUpdate(udpater, last)
                //         )
                //     },
                // }}
            >
                <DataTable<DType>
                    isLoading={!isFetched && !isPlaceholderData}
                    isLoadingMore={isPlaceholderData}
                    notFound="no spas found"
                    row={(row) => (
                        <TableRow
                            className="hover:bg-accent/50 hover:cursor-pointer"
                            data-state={row.getIsSelected() && 'selected'}
                            onClick={() => console.log('clicked')}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <TableCell
                                    key={cell.id}
                                    style={{ width: cell.column.getSize() }}
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                />
                <DataTablePagination />
            </DataTableProvider>
        </div>
    )
}
