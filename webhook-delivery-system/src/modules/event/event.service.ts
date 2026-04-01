import { prisma } from "../../db/prisma.js";
import type { emitEventInput } from "./event.schema.js";
import { webhookQueue } from "../../queues/webhook.queue.js";


export async function replayEvent(data: emitEventInput) {
    // first, store event:
    const event = await prisma.event.create({
        data: {
            type: data.type,
            payload: data.payload,
        },
    });

    //second,  now find matching subscription:
    const subscriptions = await prisma.subscription.findMany({
        where: { event: data.type },
    });

   //enqueue jobs, attach eventId, subscriptionId, and payload to be sent to queue
//    for(const sub of subscription){
//     await webhookQueue.add("deliver-event", {
//         eventId: event.id,
//         subscriptionId: sub.id,
//         payload: data.payload
//     })
//    }
    //exponential backoff + retries:
    for(const sub of subscriptions){
        await webhookQueue.add("deliver-event", {
            eventId: event.id,
            subscriptionId: sub.id,
            payload: data.payload
        },
        {
            attempts: 3,
            backoff : {
                type: "exponential",
                delay : 6969
            }
        }
    )
    }

    return {
     event,
     replayedTo: subscriptions.length,
    };
}

//core business logic for matching event and subscription
