import { Worker } from "bullmq";
import { redis } from "../lib/redis.js";

const worker = new Worker("events", async(job)=>{
    const { eventId, type, payload } = job.data;
    console.log(`processing job: ${eventId}, ${type}`)

    //placeholder -> we will replace with event handlers
},
{connection: redis}
)

worker.on("completed", (job)=>{
    console.log(`job completed ${job.id}`)
})

worker.on("failed", (job)=>{
    console.log(`job failed ${job?.id}, err`)
})


