import { prisma } from "../../db/prisma.js";
import type { emitEventInput } from "./event.schema.js";
// import { webhookQueue } from "../../queues/webhook.queue.js";
import { webhookCriticalQueue } from "../../queues/webhook.queue.js";
import { webhookDefaultQueue } from "../../queues/webhook.queue.js";
import { env } from "../../config/env.js";

export class BackpressureError extends Error {
    statusCode = 429;
    constructor(message: string){
        super(message)
        this.name ="BackpressureError"
    }
}




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

    //pick a lane (which type of queue)
    const isCritical = data.type.startsWith("payment.")
    const selectedQueue = isCritical ? webhookCriticalQueue: webhookDefaultQueue

    //queue name is narrowed down, now reject if that queue is too deep:
    const counts = await selectedQueue.getJobCounts("waiting", "active", "delayed");
    const backlog = (counts.waiting || 0 ) + (counts.active || 0) + (counts.delayed || 0);

    const maxBacklog = isCritical ? env.CRITICAL_MAX_BACKLOG : env.DEFAULT_MAX_BACKLOG
    if(backlog>maxBacklog){ throw new Error (`Queue backlog is high so we stopping it`)}
    
    for (const sub of subscriptions){
        await selectedQueue.add("deliver-event", {
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
     queue: isCritical ? "critical":"default"
    };
}

//core business logic for matching event and subscription
