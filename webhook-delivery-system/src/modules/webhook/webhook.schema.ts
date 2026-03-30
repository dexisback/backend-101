import z from "zod";

export const createWebhookSchema = z.object({
    url: z.string().url(),
    event: z.string().min(1),
    secret: z.string().min(10)
})

export type createWebhookInput = z.infer<typeof createWebhookSchema>


