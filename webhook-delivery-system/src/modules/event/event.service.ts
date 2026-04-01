import { prisma } from "../../db/prisma.js";
import type { emitEventInput } from "./event.schema.js";
import { webhookQueue } from "../../queues/webhook.queue.js";


export async function emitEvent(data: emitEventInput) {
    // first, store event:
    const event = await prisma.event.create({
        data: {
            type: data.type,
            payload: data.payload,
        },
    });

    //second,  now find matching subscription:
    const subscription = await prisma.subscription.findMany({
        where: { event: data.type },
    });

   //enqueue jobs, attach eventId, subscriptionId, and payload to be sent to queue
   for(const sub of subscription){
    await webhookQueue.add("deliver-event", {
        eventId: event.id,
        subscriptionId: sub.id,
        payload: data.payload
    })
   }
    return {
     event,
     subscription,
    };
}

//core business logic for matching event and subscription
