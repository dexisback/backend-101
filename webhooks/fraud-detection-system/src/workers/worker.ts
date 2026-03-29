import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { handlePaymentEvent } from "./handlers/payment.handler.js";

const worker = new Worker("events", async(job)=>{
    const { eventId, type, payload } = job.data;
    console.log(`processing job: ${eventId}, ${type}`)
    //routing logic:

    switch(type) {
        case "payment.captured":
        case "payment.failed": await handlePaymentEvent(eventId, type, payload);
        break;

        default:
            console.log(`unhandled event type ${type}`)
    }
    
},
{connection: redis}
)

worker.on("completed", (job)=>{
    console.log(`job completed ${job.id}`)
})

worker.on("failed", (job)=>{
    console.log(`job failed ${job?.id}, err`)
})


