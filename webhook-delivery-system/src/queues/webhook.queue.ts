import { Queue } from "bullmq";
import { env } from "../config/env.js";


export type WebhookDeliveryQueueType = {
    eventId: string,
    subscriptionId: string,
    payload: any
}

export const WEBHOOK_DEFAULT_QUEUE_NAME = "webhook-default-queue";
export const WEBHOOK_CRITICAL_QUEUE_NAME = "webhook-critical-queue";
export const WEBHOOK_DLQ_QUEUE_NAME = "webhook-dlq-queue";


export const webhookDefaultQueue = new Queue<WebhookDeliveryQueueType>(
    WEBHOOK_DEFAULT_QUEUE_NAME,
    {
        connection: {
            url: env.REDIS_URL,
        },
    }
);

export const webhookCriticalQueue = new Queue<WebhookDeliveryQueueType>(
    WEBHOOK_CRITICAL_QUEUE_NAME,
    {
        connection: {
            url: env.REDIS_URL,
        },
    }
);


export type WebhookDlqJobData = {
    originalQueue: "default" | "critical";
    originalJobId: string | number | null;
    name: string;
    attemptsMade: number;
    maxAttempts: number;
    eventId: string;
    subscriptionId: string;
    payload: any;
    failedAt: string;
    errorMessage: string;

}

export const webhookDlqQueue = new Queue<WebhookDlqJobData>(WEBHOOK_DLQ_QUEUE_NAME, {
    connection: {url: env.REDIS_URL}
})

// export const WEBHOOK_DELIVERY_QUEUE_NAME = "webhook-delivery-queue"



//this queue will hold: 
// {
//     eventId:,
//     subscriptionId,
//     payload:: {}
// }

