import type { FastifyInstance } from "fastify";
import { createSubscriptionSchema } from "./subscription.schema.js";
import { createSubscription } from "./subscription.service.js";


export async function subscriptionRoute(app: FastifyInstance) {
    app.post("/subscriptions", async(request, reply)=>{
        const receivedData= createSubscriptionSchema.safeParse(request.body)
        if(!receivedData.success){return reply.status(400).send({error: receivedData.error})}
        //else: , create our subscription
        const subscription = await createSubscription(receivedData.data)
        console.log(subscription)
        return reply.status(201).send(`subscription created ${subscription}`)
        
        
    })
}