import { Worker, Job } from "bullmq";
import redisClient from "../config/redis.js";
import {prisma} from "../config/prisma.js"
import { EmailStatus } from "../generated/prisma/enums.js";
import { templateRenderer } from "../utils/templateEngine.js";
import { sendEmailViaProvider } from "../utils/emailProvider.js";
import { logError, logInfo } from "../utils/logger.js";


const updateEmailLogSafe = async (
    logId: string | undefined,
    data: { status: EmailStatus; provider?: string; errorReason?: string }
) => {
    if (!logId) {
        logError("Worker log update skipped", { reason: "missing logId in job payload" });
        return;
    }

    try {
        await prisma.emailLog.updateMany({
            where: { id: logId },
            data
        });
    } catch (error) {
        logError("Worker log update failed", { logId, error: String(error) });
    }
};


export const emailWorker = new Worker("email-notifications", async(job: Job)=>{
    const { logId, to, eventType, payload } = job.data;
    
    await updateEmailLogSafe(logId, {status: EmailStatus.PROCESSING});

    console.log(`Processing ${eventType} email for ${to}...`)

    const htmlContent = await templateRenderer(eventType, payload)
    const subject= `Notification: ${eventType.replace("_", " ")}`;
    const deliveryResult = await sendEmailViaProvider(to, subject, htmlContent)
    await updateEmailLogSafe(logId, {
        status: EmailStatus.DELIVERED,
        provider: deliveryResult.provider
    });
    logInfo("Email worker job completed", { jobId: job.id, logId, to, eventType, provider: deliveryResult.provider });
    return {success: true, logId}



},{ connection: redisClient })




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
    await updateEmailLogSafe(job.data?.logId, {
        status: EmailStatus.FAILED,
        errorReason: err.message
    });
})

emailWorker.on("error", (err: Error) => {
    logError("Worker runtime error", { error: err.message });
});
