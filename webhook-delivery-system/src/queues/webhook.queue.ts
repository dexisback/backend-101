import { Queue } from "bullmq";
import { env } from "../config/env.js";


export type WebhookDeliveryQueueType = {
    eventId: string,
    subscriptionId: string,
    payload: any
}



export const webhookQueue= new Queue<WebhookDeliveryQueueType>("webhook-delivery-queue", {
    connection: {
        url: env.REDIS_URL!
    }
})


//this queue will hold: 
// {
//     eventId:,
//     subscriptionId,
//     payload:: {}
// }

