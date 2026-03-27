//zod validation , a tab body will contain amount and total members, so we can splitn
import z from "zod";

export const createTabSchema = z.object({
    totalAmount: z.number().int().gt(0),
    totalMembers: z.number().int().gt(0).min(1)
})

export type createTabInput = z.infer<typeof createTabSchema>

