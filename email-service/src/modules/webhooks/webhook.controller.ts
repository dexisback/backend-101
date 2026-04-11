import type { Request, Response } from "express";
import { Webhook } from "svix";
import {prisma} from "../../config/prisma.js"
import { EmailStatus, Reason } from "../../generated/prisma/enums.js";
import { logError, logInfo, logWarn } from "../../utils/logger.js";

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

export const resendWebhookHandler = async(req: Request, res: Response)=>{
    const svix_id = req.headers["svix-id"] as string;
    const svix_signature = req.headers["svix-signature"] as string;
    const svix_timeStamp = req.headers["svix-timestamp"] as string;

    if(!svix_id || !svix_signature || !svix_timeStamp) {
        return res.status(400).json({success: false, message: "missing svix headers from resend!!"})
    }
    //else:
    if(!webhookSecret){
            return res.status(400).json({success: false, message: "invalid webhook type"})
        
    }

  try {
    const wh = new Webhook(webhookSecret);
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
    const evt = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-signature": svix_signature,
      "svix-timestamp": svix_timeStamp,
    }) as { type: string; data: { to?: string[] | string } };

    const parsedBody = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body;
    const eventType = evt.type || parsedBody?.type;
    const emailData = evt.data || parsedBody?.data;
    const recipientEmail = Array.isArray(emailData?.to) ? emailData.to[0] : emailData?.to;

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: "recipient email missing in webhook payload" });
    }

    switch (eventType) {
      case 'email.delivered':
        logInfo("Webhook email delivered", { recipientEmail });
        break;

      case 'email.bounced':
        logWarn("Webhook hard bounce", { recipientEmail });
        // NOTE: Add to Suppression List to permanently block future emails
        await prisma.supressionList.upsert({
          where: { email: recipientEmail },
          update: { reason: Reason.BOUNCE },
          create: { email: recipientEmail, reason: Reason.BOUNCE },
        });
        await prisma.emailLog.updateMany({
          where: { recipient: recipientEmail, status: { not: EmailStatus.FAILED } },
          data: { status: EmailStatus.BOUNCED, errorReason: "Webhook hard bounce" },
        });
        break;

      case 'email.complained':
        logWarn("Webhook spam complaint", { recipientEmail });
        // Add to Suppression List
        await prisma.supressionList.upsert({
          where: { email: recipientEmail },
          update: { reason: Reason.COMPLAINT },
          create: { email: recipientEmail, reason: Reason.COMPLAINT },
        });
        await prisma.emailLog.updateMany({
          where: { recipient: recipientEmail, status: { not: EmailStatus.FAILED } },
          data: { status: EmailStatus.BOUNCED, errorReason: "Webhook complaint" },
        });
        break;

      default:
        logInfo("Unhandled webhook event type", { eventType });
    }

    // Always return 200 OK so the provider knows we received it
    return res.status(200).json({ success: true });

  } catch (error) {
    logError("Webhook processing error", { error: String(error) });
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}


//self notes: 
//file: resend sends a confirmation webhook to 8623, if everything is fine we just log it out, if not (our sent email was bouncy/spam/malicious) we add the email to a suppression list 
//without upsert: you'd need findUnique(email)> if exists update it> if doesnt exist > create 
//instead of these two manual queries directly use upsert
// you must have a unique constraint to make upsert work (email is @unqiue in schema.prisma)
