import z from "zod";

export const emitEventSchema = z.object({
    type: z.string().min(1),
    payload: z.any() //keep it any for now
    
})


export type emitEventInput = z.infer<typeof emitEventSchema>