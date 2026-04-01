import type { FastifyInstance } from "fastify";

import { emitEventSchema } from "./event.schema.js";
import { replayEvent } from "./event.service.js";

export async function eventRoutes(app: FastifyInstance) {
    app.post("/emit", async (request, reply)=>{
        const parsedData = emitEventSchema.safeParse(request.body);
        if(!parsedData.success){return reply.status(400).send({error: parsedData.error})}
        //else :
        const result = await replayEvent(parsedData.data);

        return reply.status(202).send({
            event: result.event,
            replayedTo: result.replayedTo,
        })
    })
}






//this file:
// receive event from outside
// zod validate it 
// pass it to business logic (replayEvent)

