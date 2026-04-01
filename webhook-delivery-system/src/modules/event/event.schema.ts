import z from "zod";


//an event will have a type and a payload
export const emitEventSchema = z.object({
    type: z.string().min(1),
    payload: z.any() //any, because generalised delivery systum
    
})


export type emitEventInput = z.infer<typeof emitEventSchema>