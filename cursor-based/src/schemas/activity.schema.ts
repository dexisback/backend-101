import z from "zod";
//activity contains developer, uska action, and project
export const createActivitySchema = z.object({
    developer: z.string().min(1, "developer name cannot be empty"),
    action: z.string().min(1, "action cannot be empty"),
    project : z.string().min(1, "project could not be empty")    
})

//cursor query now contains a limit, and a cursor ofc
export const cursorQuerySchema= z.object({
    limit: z.coerce.number().min(1).max(50).default(5),
    cursor: z.string().optional()
})
export const idSchema= z.object({
    id: z.string().uuid()
})
//types:
export type createActivityInput = z.infer<typeof  createActivitySchema>
export type createCursorQuerySchema = z.infer<typeof cursorQuerySchema>
