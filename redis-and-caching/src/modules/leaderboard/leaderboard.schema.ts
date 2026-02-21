import z from "zod";

//dont need no leaderboardshcmea 
export const QuerySchema = z.object({
    limit: z.coerce
        .number()
        .refine((value) => [10, 50, 100].includes(value), "limit must be 10, 50, or 100")
        .default(10)
})


export const CreateSchema = z.object({
    username: z.string().min(1, "name should be atleast 3 digits"),
    score:  z.number().int().min(1).gt(0)
})


export const IdParamSchema= z.object({
    id: z.string()
})

export const UpdateSchema= z.object({
    score: z.number().int().min(1).gt(0)
})

export type querySchema = z.infer<typeof QuerySchema>
export type createSchema =z.infer<typeof CreateSchema>
export type updateSchema=z.infer<typeof UpdateSchema>
export type idParamSchema= z.infer<typeof IdParamSchema>
