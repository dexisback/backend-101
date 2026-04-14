import z from "zod";
export const webhookSchema = z.object({
    event: z.string().optional(),
    type: z.string().optional(),
    eventId: z.string().optional(),
    payload: z.any(),
    created_at: z.union([z.number(), z.string()]).optional(),

})

export type Webhook = z.infer<typeof webhookSchema>;
