'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/components/shadcn/form'
import { Input } from '@repo/ui/components/shadcn/input'
import { Switch } from '@repo/ui/components/shadcn/switch'
import { Button } from '@repo/ui/components/shadcn/button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'
import { useProject } from '@/context/ProjectContext'
import { BoardSettings, boardSettingsSchema, defaultBoardSettings } from '@/lib/board-settings'
import directus from '@/lib/directus'

export function BoardSettingsForm() {
  const { data: project } = useProject() ?? {}
  const queryClient = useQueryClient()

  const form = useForm<BoardSettings>({
    resolver: zodResolver(boardSettingsSchema),
  })

  const updateSettings = useMutation({
    mutationFn: async (data: BoardSettings) => {
      return directus.ProjectsSetting.create({
        project: project?.id!,
        key: 'board',
        value: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects', project?.id, 'settings', 'board'],
      })
    },
  })

  const onSubmit = (data: BoardSettings) => {
    updateSettings.mutate(data)
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(form.getValues().columns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    form.setValue('columns', items)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Board Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {form.watch('columns').map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex items-center gap-4 rounded-lg border p-4"
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5" />
                            </div>
                            <FormField
                              control={form.control}
                              name={`columns.${index}.title`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`columns.${index}.enabled`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Enabled</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )