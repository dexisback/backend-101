import type { Request, Response  } from "express";
import { notifyPayloadSchema } from "./notification.schema.js";
import {prisma} from "../../config/prisma.js"
//TODO: later emailQueue here
import { addEmailJob } from "../../queues/producer.js";

export const notificationSender = async (req: Request, res: Response)=> {
    try {
        const receivedData  = notifyPayloadSchema.safeParse(req.body);
        if(!receivedData.success){return res.status(400).json({message: "invalid notification schema"})}

        //else:
        const validData = receivedData.data;
        const isSupressed = await prisma.supressionList.findUnique({
            where: { email: validData.to }
        })

        if(isSupressed){
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
                status: "QUEUED"
            }
        })

        //TODO: push  everything needed to bullmq over here (DONE✅ )
        const priorityLevel = validData.priority === "high" ? 1: validData.priority === "normal" ? 2: 3;

        await addEmailJob (
            validData.to,
            validData.eventType,
            validData.payload,
            priorityLevel,
            emailLog.id
        )


        return res.status(202).json({
            success: true,
            message:   `email queued for delivery`,
            logId: emailLog.id 
        })


    } catch (err) {
        console.error(`${err} error in notification controller`)
    }
}

