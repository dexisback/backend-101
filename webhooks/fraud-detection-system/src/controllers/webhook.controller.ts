import type { Request, Response } from "express";
import crypto from "crypto"

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

    res.status(200).json({message: "webhook received", receivedStatus: true})
}