
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

        //else:
        const validData = receivedData.data;
        const isSupressed = await prisma.supressionList.findUnique({
            where: { email: validData.to }
        })

        if(isSupressed){
             logWarn("Suppressed email request blocked", { to: validData.to, reason: isSupressed.reason });
             return res.status(403).json({
                success: false,
                message : `email supressed due to previous ${isSupressed.reason}`
            })
        }

        //creating the initial email Log 
        const emailLog = await prisma.emailLog.create({
            data: {
                recipient: validData.to,
                eventType: validData.eventType,
                status: EmailStatus.QUEUED
            }
        })

        const priorityLevel = validData.priority === "high" ? 1: validData.priority === "normal" ? 2: 3;

        await addEmailJob (
            validData.to,
            validData.eventType,
            validData.payload,
            priorityLevel,
            emailLog.id
        )

        logInfo("Email notification queued", {
            logId: emailLog.id,
            to: validData.to,
            eventType: validData.eventType,
            priority: validData.priority,
        });


        return res.status(202).json({
            success: true,
            message:   `email queued for delivery`,
            logId: emailLog.id 
        })
        

    } catch (err) {
        logError("Notification controller failed", { error: String(err) });
        return res.status(500).json({success: false, message: "Internal server error"}) //TODO: make this next(err) ⚠️⚠️⚠️⚠️⚠️⚠️⚠️
    }
}
