import type { Request, Response } from "express";
import { razorpaySignatureVerifier } from "../../shared/utils/signature.js";
import * as webhookService from "./webhook.service.js"

export const razorpayWebhookHandler = async(req: Request, res: Response)=>{
    const signature = req.headers["x-razorpay-signature"] as string
    const webhookSecret= process.env.RAZORPAY_WEBHOOK_SECRET as string 

    const isValid = razorpaySignatureVerifier(req.body, signature, webhookSecret);
    if(!isValid){return res.status(400).json({error: "invalid signature"})}

    const payload = JSON.parse(req.body.toString())

    if(payload.event === "order.paid" || payload.event === "payment.captured") {
        const orderId = payload.payload.payment.entity.order_id
        await webhookService.paymentProcessor(orderId)

        res.status(200).send("OK")

        try {
            
        } catch (err) {
            console.error(`${err} is the error, something webhook processing related error`)
            
        }
        res.status(200).send("OK")
    }

}















//intercepts the webhook > verifies the signature > routes it to the service based on the event type 
