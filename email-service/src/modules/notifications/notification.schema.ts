import z from "zod";




export const notifyPayloadSchema = z.object({
    to: z.string().email({message: "invalid email address"}),
    eventType: z.string().min(1, {message: "event type is required"}),
    payload: z.record(z.string(), z.any()).default({}),  //dynamic variables for the template 
    priority: z.enum(["high", "normal", "low"]).default("normal")

})



export type notifyPayloadSchemaType = z.infer<typeof notifyPayloadSchema>;

