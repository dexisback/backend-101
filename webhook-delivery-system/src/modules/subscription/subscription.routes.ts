import type { FastifyInstance } from "fastify";
import { createSubscriptionSchema } from "./subscription.schema.js";
import { createSubscription } from "./subscription.service.js";


export async function subscriptionRoute(app: FastifyInstance) {
    app.post("/subscriptions", async(request, reply)=>{
        const receivedData= createSubscriptionSchema.safeParse(request.body)
        if(!receivedData.success){return reply.status(400).send({error: receivedData.error})}
        //else: , create our subscription
        const subscription = await createSubscription(receivedData.data)
        // console.log(subscription)
        return reply.status(201).send({id: subscription.id,event:  subscription.event}) //avoid sending other things since it might expose data. id and event are enough
        
        
    })
}




//SELF NOTE; return reply.status(201).json({id: subscription.id, url: subscription.url, createdAt: subscription.createdAt})   the json thing doesnt exist in fastify, everything is just send. 
