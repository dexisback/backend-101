import { Queue } from "bullmq";
import redisClient from "../config/redis.js";

let emailQueue: Queue | null = null;

const getEmailQueue = () => {
    if (!emailQueue) {
        emailQueue = new Queue("email-notifications", {
            connection: redisClient,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 2000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        });
    }
    return emailQueue;
};


export const addEmailJob = async (to: string, eventType: string, payload: any, priorityNum: number, logId: string)=> {
    return await getEmailQueue().add(eventType, 
        {to, eventType, payload, logId}, 
        {priority: priorityNum}
    )
}
