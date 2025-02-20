import React from 'react'

export default function useTableHooks<T>() {
    const [deleteContext, setDeleteContext] = React.useState<{
        out: number
        of: number
    }>({
        out: 0,
        of: 0,
    })
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [isViewSheetOpen, setIsViewSheetOpen] = React.useState(false)
    const [selectedToDelete, setSelectedToDelete] = React.useState<T[]>()
    const [selectedToEdit, setSelectedToEdit] = React.useState<T[]>()
    const [selectedToView, setSelectedToView] = React.useState<T[]>()
    const setMaxDeleteContext = React.useCallback((max: number) => {
        setDeleteContext((prev) => ({
            ...prev,
            of: max,
        }))
    }, [])
    const incrementDeleteContext = React.useCallback(() => {
        setDeleteContext((prev) => ({
            ...prev,
            out: prev.out === prev.of ? prev.of : prev.out + 1,
        }))
    }, [])

    const triggerToDelete = React.useCallback(
        async (images: T[]) => {
            setSelectedToDelete(images)
            setIsDeleteDialogOpen(true)
            setMaxDeleteContext(images.length)
        },
        [setMaxDeleteContext]
    )

    const triggerToEdit = React.useCallback(async (images: T[]) => {
        setSelectedToEdit(images)
        setIsEditSheetOpen(true)
    }, [])

    const triggerToView = React.useCallback(async (images: T[]) => {
        setSelectedToView(images)
        setIsViewSheetOpen(true)
    }, [])

    return {
        deleteContext,
        isDeleteDialogOpen,
        isEditSheetOpen,
        isCreateDialogOpen,
        isViewSheetOpen,
        selectedToDelete,
        selectedToEdit,
        selectedToView,
        setDeleteContext,
        setIsDeleteDialogOpen,
        setIsEditSheetOpen,
        setIsCreateDialogOpen,
        setIsViewSheetOpen,
        triggerToDelete,
        triggerToEdit,
        triggerToView,
        resetDeleteContext: () =>
            setDeleteContext({
                out: 0,
                of: 0,
            }),
        resetSelectedToDelete: () => setSelectedToDelete([]),
        resetSelectedToEdit: () => setSelectedToEdit([]),
        resetSelectedToView: () => setSelectedToView([]),
        incrementDeleteContext,
        setMaxDeleteContext,
    }
}
