import { Queue } from "bullmq";
import { bullConnection } from "../../config/redis.connection.js";

export const webhookQueue = new Queue("webhook-processing", {connection: bullConnection, defaultJobOptions: {
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 100
}})
