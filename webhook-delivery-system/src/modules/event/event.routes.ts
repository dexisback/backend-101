import type { FastifyInstance } from "fastify";

import { emitEventSchema } from "./event.schema.js";
import { emitEvent } from "./event.service.js";

export async function eventRoutes(app: FastifyInstance) {
    app.post("/emit", async (request, reply)=>{
        const parsedData = emitEventSchema.safeParse(request.body);
        if(!parsedData.success){return reply.status(400).send({error: parsedData.error})}
        //else :
        const finalData = await emitEvent(parsedData.data);

        return reply.status(201).send({
            event: finalData.event,
            subscribersFound : finalData.subscription.length
        })
    })
}

//this file:
// receive event from outside
// zod validate it 
// pass it to business logic (emitEvent)

