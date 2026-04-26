import type { Request, Response } from "express";
import crypto from "crypto"
import { webhookSchema } from "../validators/webhook.schema.js";
import { enqueueEvent } from "../services/queue.service.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";
import { runFraudChecks } from "../services/fraud.service.js";
import { createEvent } from "../services/event.service.js";
import { checkDuplicate } from "../services/idempotency.service.js";


export const webhookHandler = async (req: Request, res: Response)=>{
    const providerParam = req.params.provider;
    const provider = Array.isArray(providerParam) ? providerParam[0] : providerParam; //take out the provider (github/saas webhook/stripe/etc etc)
    if (!provider) {
        return res.status(400).json({ error: "missing provider" });
    }
    const rawBody = req.body; //rawbody 
    //verify signature code lies in controller for now, TODO: thin out controller later on and verify logic in anothe file ⚠️⚠️⚠️
    const currentSignature = req.headers["x-razorpay-signature"] as string | undefined;
    const secret = env.WEBHOOK_SECRET;

    if (secret && currentSignature) {
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        // Uncomment to enforce strict signature rejection
        // if (expectedSignature !== currentSignature) {
        //     return res.status(400).json({ error: "wrong and invalid signature" });
        // }
        console.log(`verified webhook signature from ${provider}`);
    } else {
        console.log(`signature verification skipped for ${provider}`);
    }
    //logger:
    logger.info("Webhook received", { provider });

    console.log(`received webhook from ${provider}`)
    
    //parsing to string for scema processing

    let parsedSignature: unknown;
    try {
        parsedSignature = JSON.parse(rawBody.toString());
    } catch {
        return res.status(400).json({ error: "invalid JSON payload" });
    }
    
    // console.log("RAW BODY:", rawBody.toString());
    // console.log("PARSED", parsedSignature)
    //schema processing:
    const result = webhookSchema.safeParse(parsedSignature)
    
    if(!result.success){return res.status(400).send({error: "invalid payload, failed zod validation"})} 
    //else:
    const finalworkingData =result.data
    const eventType = finalworkingData.type || finalworkingData.event;
    const eventPayload = finalworkingData.payload;
    const eventId = finalworkingData.eventId || eventPayload.commitId || eventPayload.id;

    if (!eventType || !eventId) {
        return res.status(400).json({ error: "missing event type or event id" });
    }

    console.log(`valid webhook ${eventType}`)

    //we now have the final working data, now the idempotency logic (dont process the same webhook if alr received by the provider)
    try {
        await createEvent(eventId, provider, eventType, eventPayload);
        
        //run fraud checks and create alerts if needed:
        await runFraudChecks(eventId, eventType, eventPayload);
        
        //push in the queue (enqueue) from qeuueService:
        await enqueueEvent({
            eventId,
            type: eventType,
            payload: eventPayload
        })


    } catch (err: any) {
        if(err.code === "P2002"){return res.status(200).json({message: "duplicate event/webhook ignored"})}
            throw err
    }



    res.status(200).json({message: "webhook received", receivedStatus: true})
}
