import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@repo/ui/components/shadcn/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/shadcn/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/shadcn/card"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { cn } from "@repo/ui/lib/utils"
import { Switch } from "@repo/ui/components/shadcn/switch"
import { GripVertical } from "lucide-react"
import { Collections } from "@repo/directus-sdk/client"

const boardSettingsSchema = z.object({
  columns: z.array(z.object({
    id: z.string(),
    label: z.string(),
    enabled: z.boolean(),
  }))
})

type BoardSettings = z.infer<typeof boardSettingsSchema>

const defaultColumns = [
  { id: "todo", label: "To Do", enabled: true },
  { id: "in-progress", label: "In Progress", enabled: true },
  { id: "done", label: "Done", enabled: true },
]

interface ProjectSettingsFormProps {
  project: Collections.Projects
  onSubmit: (data: BoardSettings) => void
  defaultValues?: BoardSettings
}

export function ProjectSettingsForm({ project, onSubmit, defaultValues = { columns: defaultColumns } }: ProjectSettingsFormProps) {
  const form = useForm<BoardSettings>({
    resolver: zodResolver(boardSettingsSchema),
    defaultValues,
  })

  function onDragEnd(result: any) {
    if (!result.destination) return

    const items = Array.from(form.getValues().columns)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    form.setValue("columns", items)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Board Settings</CardTitle>
            <CardDescription>
              Customize how columns appear on your board
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="text-sm font-medium">Column Order and Visibility</div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="columns">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {form.getValues().columns.map((column, index) => (
                        <Draggable key={column.id} draggableId={column.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "flex items-center justify-between p-4",
                                "rounded-lg border bg-card"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-medium">{column.label}</span>
                              </div>
                              <FormField
                                control={form.control}
                                name={`columns.${index}.enabled`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-2">
                                    <FormLabel className="text-sm">Show</FormLabel>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormMessage />
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
            </div>
          </CardContent>
        </Card>
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}