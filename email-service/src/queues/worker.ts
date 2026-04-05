import { Worker, Job, tryCatch } from "bullmq";
import redisClient from "../config/redis.js";
import {prisma} from "../config/prisma.js"
import { log } from "node:console";
import { connect } from "node:http2";


export const emailWorker = new Worker("email-notifications", async(job: Job)=>{ //ideally you should use a variable in both producer, and worker but i wont for now just because
    const { logId, to, eventType, payload } = job.data;
    
    //first, we mark the status as Processing in db:
    await prisma.emailLog.update({
        where: {id: logId},
        data: {status: "PROCESSING"}  //TODO: add variable enums, instead of hardcoded string statuses ⚠️⚠️⚠️⚠️⚠️
    })

    //then we compile HTML template and send it via resend(first)/nodemailer(second)
    console.log(`Processing ${eventType} email for ${to}...`)
    //dummy for now : TODO: add real ⚠️⚠️⚠️⚠️⚠️
    await new Promise((resolve)=>{
        setTimeout(resolve, 1000); //simulating network delay
    })
    

    //then we mark as delivered if the provider succesfully updates it:
    await prisma.emailLog.update({
        where: { id: logId },
        data: {status: "DELIVERED", provider: "resend"} //TODO: fix and remove hardcoded as we add logic ⚠️⚠️⚠️⚠️

    }) 
    return { success: true, logId };



},{ connection: redisClient })




//event listenders for observability and dlq handling:
emailWorker.on("completed", (job)=>{
    console.log(`Job with jobId ${job.id} completeduh succesfullyuh`)
})
emailWorker.on("failed", async  (job: Job | undefined , err: Error)=>{
    if(!job){return}
    //else:
    console.error(`Job with jobId ${job.id} failed attempt ${job.attemptsMade} times, error: ${err.message} `)
    if(job.attemptsMade >= (job.opts.attempts ?? 5)){
        console.log(`job permanently failed, flagging as terminal errror . jobId: ${job.id}`)    
    }
    await prisma.emailLog.update({
        where: { id: job.data.logId},
        data: {status: "FAILED" , errorReason: err.message}
    })
})