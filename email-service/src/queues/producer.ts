import { Queue } from "bullmq";
import redisClient from "../config/redis.js";


export const emailQueue = new Queue("email-notifications", {
    connection: redisClient,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 2000
        },
        removeOnComplete: true, //auto dlt succesfull jobs from redis to save ram memory
        removeOnFail: false //why? because dlq
    }
})


//we directly use this in other files to add a job 
export const addEmailJob = async (eventType: string, payload: any, priorityNum: number, logId: string)=> {
    return await emailQueue.add(eventType, {...payload, logId}, {priority: priorityNum})  //why third arg object? because bullmq only takes in 3 args, and we need to attach priority level and logId (both numbers ko ek object me ghusa rhe)
}



