import z from "zod";
export const webhookSchema = z.object({
    event: z.string(),
    payload: z.any(),
    created_at: z.union([z.number(), z.string()]),

})

export type Webhook = z.infer<typeof webhookSchema>;
