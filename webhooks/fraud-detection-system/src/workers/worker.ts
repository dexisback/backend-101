import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";
import { handlePaymentEvent } from "./handlers/payment.handler.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

const worker = new Worker("events", async(job)=>{
    const { eventId, type, payload } = job.data;
    logger.info("Processing job", { eventId, type });

    // console.log(`processing job: ${eventId}, ${type}`)
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

worker.on("failed", async (job, err)=>{
    logger.error("Job failed", { jobId: job?.id, err });
    // console.error(`Job failed: ${job?.id}`, err)
    if(!job){return }
    //else: update the status in DB
    await prisma.event.update({
        where: {eventId: job.data.eventId},
        data: {status: "FAILED"}
    })
})


