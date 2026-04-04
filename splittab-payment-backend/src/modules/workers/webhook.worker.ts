import { Worker, Job } from "bullmq";
import { paymentProcessor } from "../webhooks/webhook.service.js";
import "dotenv/config"


const redisConnection ={
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
}


export const startWebhookWorker = () => {
    const worker = new Worker("worker-processing", async(job: Job)=> {
        console.log(`Worker picking up job with jobId -> ${job.id} for orderId -> ${job.data.orderId}`)
        await paymentProcessor(job.data.orderId)

    },{connection: redisConnection})
    
    
    
    worker.on("completed", (job)=>{
        console.log(`job with jobId ${job.id} completed succesfully`)
    })

    worker.on("failed", (job, err)=>{
        console.error(`job with jobId ${job?.id} failed with error: ${err.message}`)
        //note: / If this fails 3 times (based on our Queue settings), it stays in Redis as a "failed" job, effectively acting as our Dead Letter Queue (DLQ)
    })
    return worker;
    
}