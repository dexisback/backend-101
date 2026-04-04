import type { Request, Response } from "express";
import { razorpaySignatureVerifier } from "../../shared/utils/signature.js";
import * as webhookService from "./webhook.service.js"
import { webhookQueue } from "../workers/webhook.queue.js";  //market me new overengineering aayi hai 🥀

export const razorpayWebhookHandler = async(req: Request, res: Response)=>{
    const signature = req.headers["x-razorpay-signature"] as string
    const webhookSecret= process.env.RAZORPAY_WEBHOOK_SECRET as string 

    const isValid = razorpaySignatureVerifier(req.body, signature, webhookSecret);
    if(!isValid){return res.status(400).json({error: "invalid signature"})}

    const payload = JSON.parse(req.body.toString())

    if(payload.event === "order.paid" || payload.event === "payment.captured") {
        const orderId = payload.event === "payment.captured"
            ? payload.payload.payment.entity.order_id
            : payload.payload.order.entity.id
        // await webhookService.paymentProcessor(orderId)
        await webhookQueue.add("process-razorpay-success", {orderId})
        console.log(`Added order ${orderId} to BullMq`)

        return res.status(200).send("OK")
    }

    return res.status(200).send("OK")

}















//intercepts the webhook > verifies the signature > routes it to the service based on the event type 
