import type { Request, Response } from "express";

export const webhookHandler = async (req: Request, res: Response)=>{
    const provider = req.params.provider; //take out the provider (github/saas webhook/stripe/etc etc)

    const rawBody = req.body; //rawbody 

    console.log(`received webhook from ${provider}`)

    res.status(200).json({message: "webhook received", receivedStatus: true})
}