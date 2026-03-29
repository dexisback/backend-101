import z from "zod";
export const webhookSchema = z.object({
    event: z.string(),
    payload: z.any(),
    createdAt: z.number()
})

export type Webhook = z.infer<typeof webhookSchema>;
