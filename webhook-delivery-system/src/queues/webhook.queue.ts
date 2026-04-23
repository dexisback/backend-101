import { Queue } from "bullmq";
import { env } from "../config/env.js";


export type WebhookDeliveryQueueType = {
    eventId: string,
    subscriptionId: string,
    payload: any
}

export const WEBHOOK_DELIVERY_QUEUE_NAME = "webhook-delivery-queue"

export const webhookQueue= new Queue<WebhookDeliveryQueueType>(WEBHOOK_DELIVERY_QUEUE_NAME, {
    connection: {
        url: env.REDIS_URL
    }
})


//this queue will hold: 
// {
//     eventId:,
//     subscriptionId,
//     payload:: {}
// }

