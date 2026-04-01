import z from "zod";

export const createSubscriptionSchema = z.object({
    url: z.string().url(),
    event: z.string().min(1),
    secret: z.string().min(10)
})

export type createSubscriptionInput= z.infer<typeof createSubscriptionSchema>


