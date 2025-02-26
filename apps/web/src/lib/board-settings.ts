import { z } from 'zod'

export const boardColumnSchema = z.object({
  id: z.enum(['todo', 'in-progress', 'done']),
  title: z.string(),
  enabled: z.boolean(),
})

export type BoardColumn = z.infer<typeof boardColumnSchema>

export const boardSettingsSchema = z.object({
  columns: z.array(boardColumnSchema),
})

export type BoardSettings = z.infer<typeof boardSettingsSchema>

export const defaultBoardSettings: BoardSettings = {
  columns: [
    { id: 'todo', title: 'To Do', enabled: true },
    { id: 'in-progress', title: 'In Progress', enabled: true },
    { id: 'done', title: 'Done', enabled: true },
  ],
}