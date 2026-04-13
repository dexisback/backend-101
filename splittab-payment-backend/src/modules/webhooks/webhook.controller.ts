import type { Request, Response } from "express";
import { webhookQueue } from "../workers/webhook.queue.js";  //market me new overengineering aayi hai 🥀

export const razorpayWebhookHandler = async(req: Request, res: Response)=>{
    const payload = JSON.parse(req.body.toString())

    if(payload.event === "order.paid" || payload.event === "payment.captured") {
        let orderId = "";
        if (payload.event === "payment.captured") {
            orderId = payload.payload.payment.entity.order_id;
        } else {
            orderId = payload.payload.order.entity.id;
        }
        if (typeof orderId !== "string" || !orderId) {
            return res.status(400).json({ error: "invalid orderId in webhook payload" });
        }
        // await webhookService.paymentProcessor(orderId)
        await webhookQueue.add("process-razorpay-success", {orderId})
        console.log(`Added order ${orderId} to BullMq`)

        return res.status(200).send("OK")
    }

    return res.status(200).send("OK")

}















//intercepts the webhook > verifies the signature > routes it to the service based on the event type 
