import type { Request, Response, NextFunction } from "express";
import {prisma} from "../../config/prisma.js"
import cloudinary from "../../config/cloudinary.js";


export const cloudinaryWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { notification_type, public_id, secure_url, context } = req.body;
    const signatureHeader = req.headers["x-cld-signature"] as string;
    const timestampHeader = Number(req.headers["x-cld-timestamp"]);
    const rawBody = (req as any).rawBody as string;

    if (!signatureHeader || !timestampHeader || !rawBody) {
        return res.status(401).json({ error: "Invalid webhook signature" });
    }

    //if signature doesnt match, attacker might be sending fake success signals/webhook
    const isValid = cloudinary.utils.verifyNotificationSignature(
        rawBody,
        timestampHeader,
        signatureHeader
    );

    if (!isValid) {
        return res.status(401).json({error: "Invalid webhook signature"})
    }

    if (notification_type !== "upload") {
        return res.status(200).send("ignored")
    }
    
    //extract the hidden db id we taped onto the file earlier:
    let mediaId = context?.custom?.mediaId || context?.mediaId;
    if (!mediaId && typeof context === "string") {
        const match = context.match(/(?:^|\|)mediaId=([^|]+)/);
        mediaId = match?.[1];
    }

    if(!mediaId) {
        console.error("Webhook received without mediaId context");
        return res.status(400).send("Missing context")
    }

    //4: update db based on cloudinary's scan and processing results:
    if (secure_url) {
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
