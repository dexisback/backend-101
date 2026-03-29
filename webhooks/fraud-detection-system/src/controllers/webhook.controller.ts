import type { Request, Response } from "express";
import crypto from "crypto"
import { webhookSchema } from "../validators/webhook.schema.js";
import {prisma} from "../lib/prisma.js";
import { error } from "console";

export const webhookHandler = async (req: Request, res: Response)=>{
    const provider = req.params.provider; //take out the provider (github/saas webhook/stripe/etc etc)
    const rawBody = req.body; //rawbody 
    //verify signature code lies in controller for now, TODO: thin out controller later on and verify logic in anothe file ⚠️⚠️⚠️
    const currentSignature = req.headers["x-razorpay-signature"] as string
    const secret= process.env.WEBHOOK_SECRET as string;

    const expectedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")   //razorpay (example) does the same loc on their end, if it matches , yes
    if(expectedSignature!==currentSignature){res.status(400).json({error: "wrong and invalid signature"})}
    //else:
    console.log(`verified webhook from ${provider}`)
    console.log(`received webhook from ${provider}`)
    
    //parsing to string for scema processing
    const parsedSignature = JSON.parse(rawBody.toString())
    
    //schema processing:
    const result = webhookSchema.safeParse(parsedSignature)
    if(!result.success){return res.status(400).send({error: "invalid payload, failed zod validation"})} 
    //else:
    const finalworkingData =result.data
    console.log(`valid webhook ${finalworkingData.event}`)

    //we now have the final working data, now the idempotency logic (dont process the same webhook if alr received by the provider)
    try {
        await prisma.event.create({
            data: {
                eventId: finalworkingData.payload.id,   //depends on the provider structure
                provider, 
                type: finalworkingData.event,
                payload: finalworkingData.payload
            }
        })
    } catch (err: any) {
        if(err.code === "P2002"){return res.status(200).json({message: "duplicate event/webhook ignored"})}
            throw error
    }



    res.status(200).json({message: "webhook received", receivedStatus: true})
}