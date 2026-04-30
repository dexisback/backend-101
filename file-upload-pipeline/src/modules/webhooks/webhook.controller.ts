import type { Request, Response, NextFunction } from "express";
import {prisma} from "../../config/prisma.js"
import cloudinary from "../../config/cloudinary.js";
import { demoLog } from "../../utils/logger.js";


export const cloudinaryWebhookHandler = async (req: Request, res: Response, next: NextFunction) => {
    demoLog.banner("LARGE UPLOAD: webhook");
    demoLog.info("LARGE", "Webhook received", { method: req.method, path: req.path });
    const { notification_type, public_id, secure_url, context } = req.body;
    const signatureHeader = req.headers["x-cld-signature"] as string;
    const timestampHeader = Number(req.headers["x-cld-timestamp"]);
    const rawBody = (req as any).rawBody as string;

    if (!signatureHeader || !timestampHeader || !rawBody) {
        demoLog.warn("LARGE", "Missing webhook signature headers/body");
        return res.status(401).json({ error: "Invalid webhook signature" });
    }

    //if signature doesnt match, attacker might be sending fake success signals/webhook
    demoLog.step("LARGE", "Webhook signature verification start");
    const isValid = cloudinary.utils.verifyNotificationSignature(
        rawBody,
        timestampHeader,
        signatureHeader
    );

    if (!isValid) {
        demoLog.warn("LARGE", "Webhook signature verification failed");
        return res.status(401).json({error: "Invalid webhook signature"})
    }
    demoLog.ok("LARGE", "Webhook signature verified");

    if (notification_type !== "upload") {
        demoLog.info("LARGE", "Ignoring non-upload notification", { notification_type });
        return res.status(200).send("ignored")
    }
    
    //extract the hidden db id we taped onto the file earlier:
    let mediaId = context?.custom?.mediaId || context?.mediaId;
    if (!mediaId && typeof context === "string") {
        const match = context.match(/(?:^|\|)mediaId=([^|]+)/);
        mediaId = match?.[1];
    }

    if(!mediaId) {
        demoLog.err("LARGE", "Webhook missing mediaId context", { context });
        return res.status(400).send("Missing context")
    }
    demoLog.info("LARGE", "Resolved mediaId from context", { mediaId, public_id });

    //4: update db based on cloudinary's scan and processing results:
    if (secure_url) {
        demoLog.step("LARGE", "DB update start (VERIFIED)");
        await prisma.largeMedia.update({
            where: { id: mediaId },
            data: {
                status: "VERIFIED",
                fileUrl: secure_url,
                publicId: public_id
            }
        })
        demoLog.ok("LARGE", "DB update complete (VERIFIED)", { mediaId, public_id });
    } else {
        //clodinary's malware scanner flagged it, or processing failed:
        demoLog.step("LARGE", "DB update start (FAILED)");
        await prisma.largeMedia.update({
            where: { id: mediaId },
            data: { status: "FAILED" }
        }
        )
        demoLog.ok("LARGE", "DB update complete (FAILED)", { mediaId, public_id });
    }
    return res.status(200).send(`webhook received!`)
}
