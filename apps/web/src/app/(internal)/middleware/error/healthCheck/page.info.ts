import { z } from 'zod'

export const Route = {
    name: 'MiddlewareerrorhealthCheck',
    params: z.object({}),
    search: z.object({
        from: z.string().optional(),
        json: z.string().optional(),
    }),
}
