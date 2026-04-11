import { Worker, Job } from "bullmq";
import redisClient from "../config/redis.js";
import {prisma} from "../config/prisma.js"
import { EmailStatus } from "../generated/prisma/enums.js";
import { templateRenderer } from "../utils/templateEngine.js";
import { sendEmailViaProvider } from "../utils/emailProvider.js";
import { logError, logInfo } from "../utils/logger.js";



export const emailWorker = new Worker("email-notifications", async(job: Job)=>{ //ideally you should use a variable in both producer, and worker but i wont for now just because
    const { logId, to, eventType, payload } = job.data;
    
    //first, we mark the status as Processing in db:
    await prisma.emailLog.update({
        where: {id: logId},
        data: {status: EmailStatus.PROCESSING}
    })

    //then we compile HTML template and send it via resend(first)/nodemailer(second)
    console.log(`Processing ${eventType} email for ${to}...`)
    //dummy for now : TODO: add real ✅✅✅✅

    const htmlContent = await templateRenderer(eventType, payload)
    const subject= `Notification: ${eventType.replace("_", " ")}`;
    const deliveryResult = await sendEmailViaProvider(to, subject, htmlContent)
    await prisma.emailLog.update({
        where : {id: logId},
        data: {
            status: EmailStatus.DELIVERED,
            provider: deliveryResult.provider
        }
    })
    logInfo("Email worker job completed", { jobId: job.id, logId, to, eventType, provider: deliveryResult.provider });
    return {success: true, logId}



},{ connection: redisClient })




//event listenders for observability and dlq handling:
emailWorker.on("completed", (job)=>{
    logInfo("Worker completed event emitted", { jobId: job.id });
})
emailWorker.on("failed", async  (job: Job | undefined , err: Error)=>{
    if(!job){return}
    //else:
    logError("Worker job failed", { jobId: job.id, attemptsMade: job.attemptsMade, error: err.message });
    if(job.attemptsMade >= (job.opts.attempts ?? 5)){
        logError("Worker job reached max attempts", { jobId: job.id, attemptsMade: job.attemptsMade });
    }
    await prisma.emailLog.update({
        where: { id: job.data.logId},
        data: {status: EmailStatus.FAILED , errorReason: err.message}
    })
})
