import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";
import { env } from "../config/env.js";

const eventQueue = new Queue(env.QUEUE_NAME, {connection: redis})
export const enqueueEvent = async (data : {eventId: string, type: string, payload: any})=>{
    await eventQueue.add("process-event", data, {
        attempts: 3 ,//retrying 3 times
        backoff: {type: "exponential", delay: 1000}
    })
}

//event queue ,  job = process-event , if worker fails try for 3 times max, 
