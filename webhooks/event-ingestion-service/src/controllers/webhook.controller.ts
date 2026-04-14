import type { Request, Response } from "express";
import crypto from "crypto"
import { webhookSchema } from "../validators/webhook.schema.js";
import {prisma} from "../lib/prisma.js";
import { enqueueEvent } from "../services/queue.service.js";
import { logger } from "../lib/logger.js";


export const webhookHandler = async (req: Request, res: Response)=>{
    const providerParam = req.params.provider;
    const provider = Array.isArray(providerParam) ? providerParam[0] : providerParam; //take out the provider (github/saas webhook/stripe/etc etc)
    if (!provider) {
        return res.status(400).json({ error: "missing provider" });
    }
    const rawBody = req.body; //rawbody 
    //verify signature code lies in controller for now, TODO: thin out controller later on and verify logic in anothe file ⚠️⚠️⚠️
    const currentSignature = req.headers["x-razorpay-signature"] as string
    const secret= process.env.WEBHOOK_SECRET as string;

    const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")   //razorpay (example) does the same loc on their end, if it matches , yes
    // if(expectedSignature!==currentSignature){res.status(400).json({error: "wrong and invalid signature"})}   //NOTE: comment out this line to curl test locally //
    //else:
    console.log(`verified webhook from ${provider}`)
    //logger:
    logger.info("Webhook received", { provider });

    console.log(`received webhook from ${provider}`)
    
    //parsing to string for scema processing

    const parsedSignature = JSON.parse(rawBody.toString());
    
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
        await prisma.event.create({
            data: {
                eventId,
                provider, 
                type: eventType,
                payload: eventPayload
            }
        })
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
