import type { Request, Response, NextFunction } from "express";
import {prisma} from "../../config/prisma.js"
import { env } from "../../config/env.js"
import crypto from "crypto"


export const cloudinaryWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { notification_type, status, public_id, secure_url, context } = req.body;
    const signatureHeader = req.headers['x-cld-signature'] as string;
    const timestamp = req.body.timestamp;
    const payloadToSign = `${notification_type}-${timestamp}-${env.CLOUDINARY_API_SECRET}`
    const expectedSignature = crypto.createHash("sha1").update(payloadToSign).digest("hex");
    //if signature doesnt match, attacker might be sending fake success signals/webhook

    if (signatureHeader !== expectedSignature) {
        return res.status(401).json({error: "Invalid webhook signature"})
    }

    if (notification_type !== "upload") {
        return res.status(200).send("ignored")
    }
    
    //extract the hidden db id we taped onto the file earlier:
    const mediaId = context?.custom?.mediaId;

    if(!mediaId) {
        console.error("Webhook received without mediaId context");
        return res.status(400).send("Missing context")
    }

    //4: update db based on cloudinary's scan and processing results:
    if (status === "success") {
        await prisma.largeMedia.update({
            where: { id: mediaId },
            data: {
                status: "VERIFIED",
                fileUrl: secure_url,
                publicId: public_id
            }
        })
    } else {
        //clodinary's malware scanner flagged it, or processing failed:
        await prisma.largeMedia.update({
            where: { id: mediaId },
            data: { status: "FAILED" }
        }
        )
    }
    return res.status(200).send(`webhook received!`)
}

