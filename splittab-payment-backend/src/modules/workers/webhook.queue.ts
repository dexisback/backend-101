import { Queue } from "bullmq";
import "dotenv/config"


const redisConnection = {
    host: process.env.REDIS_HOST ,
    port: Number(process.env.REDIS_PORT)
    //password not needed since this project uses upstash
}

export const webhookQueue = new Queue("webhook-processing", {connection: redisConnection, defaultJobOptions: {
    attempts: 3,
    backoff: {
        type: "exponential",
        delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: 100
}})