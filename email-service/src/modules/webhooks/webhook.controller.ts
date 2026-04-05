import type { Request, Response } from "express";
import { Webhook } from "svix";
import {prisma} from "../../config/prisma.js"

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
    const evt = wh.verify(JSON.stringify(req.body), {
      "svix-id": svix_id,
      "svix-signature": svix_signature,
      "svix-timestamp": svix_timeStamp,
    }) as { type: string; data: { to?: string[] | string } };

    const eventType = evt.type;
    const emailData = evt.data;
    const recipientEmail = Array.isArray(emailData?.to) ? emailData.to[0] : emailData?.to;

    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: "recipient email missing in webhook payload" });
    }

    switch (eventType) {
      case 'email.delivered':
        console.log(`Webhook: Email delivered to ${recipientEmail}`);
        // If we saved the providerId in the DB earlier, we would use it here to update the exact EmailLog to 'DELIVERED'.
        break;

      case 'email.bounced':
        console.warn(`Webhook: Hard bounce for ${recipientEmail}`);
        // Add to Suppression List to permanently block future emails
        await prisma.supressionList.upsert({
          where: { email: recipientEmail },
          update: { reason: 'BOUNCE' },
          create: { email: recipientEmail, reason: 'BOUNCE' },
        });
        break;

      case 'email.complained':
        console.warn(`Webhook: Spam complaint from ${recipientEmail}`);
        // Add to Suppression List
        await prisma.supressionList.upsert({
          where: { email: recipientEmail },
          update: { reason: 'COMPLAINT' },
          create: { email: recipientEmail, reason: 'COMPLAINT' },
        });
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // Always return 200 OK so the provider knows we received it
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}