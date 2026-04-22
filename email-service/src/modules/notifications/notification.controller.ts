
import type { Request, Response  } from "express";
import { notifyPayloadSchema } from "./notification.schema.js";
import {prisma} from "../../config/prisma.js"
import { EmailStatus } from "../../generated/prisma/enums.js";
import { addEmailJob } from "../../queues/producer.js";
import { logError, logInfo, logWarn } from "../../utils/logger.js";

export const notificationSender = async (req: Request, res: Response)=> {
    try {
        const receivedData  = notifyPayloadSchema.safeParse(req.body);
        if(!receivedData.success){
            return res.status(400).json({message: "invalid notification schema"});
        }

        const validData = receivedData.data;
        const suppressed = await prisma.supressionList.findUnique({
            where: { email: validData.to }
        });

        if (suppressed) {
            logWarn("Suppressed email request blocked", { to: validData.to, reason: suppressed.reason });
            return res.status(403).json({
                success: false,
                message: `email suppressed due to previous ${suppressed.reason}`
            });
        }

        const emailLog = await prisma.emailLog.create({
            data: {
                recipient: validData.to,
                eventType: validData.eventType,
                status: EmailStatus.QUEUED
            }
        });

        const priorityMap: Record<string, number> = { high: 1, normal: 2, low: 3 };
        const priorityLevel = priorityMap[validData.priority] || 2;

        try {
            await addEmailJob(
                validData.to,
                validData.eventType,
                validData.payload,
                priorityLevel,
                emailLog.id
            );
        } catch (queueErr) {
            await prisma.emailLog.updateMany({
                where: { id: emailLog.id },
                data: {
                    status: EmailStatus.FAILED,
                    errorReason: `Queue enqueue failed: ${String(queueErr)}`
                }
            });
            throw queueErr;
        }

        logInfo("Email notification queued", {
            logId: emailLog.id,
            to: validData.to,
            eventType: validData.eventType,
            priority: validData.priority
        });

        return res.status(202).json({
            success: true,
            message: "email queued for delivery",
            logId: emailLog.id
        });
        

    } catch (err) {
        logError("Notification controller failed", { error: String(err) });
        const errorDetail = process.env.NODE_ENV === "development" ? String(err) : undefined;
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: errorDetail
        });
    }
}
