import {prisma}  from "../../db/prisma.js"
// we will be generating HMAC in this file only: in hindsight no, it will look more cracked as a separate folder
import { generateHmac } from "../../utlis/hmac.js";

export async function processWebhookDelivery(data: {
    eventId: string,
    subscriptionId: string,
    payload: any,
    attempt: number
}) {
    const { eventId, subscriptionId, payload, attempt } = data;
    //fetch event:
    const event = await prisma.event.findUnique({
        where: {id: eventId}
    })
    //fetch subscription:
    const subscription = await prisma.subscription.findUnique({
        where: {id:subscriptionId}
    })
    
    if(!event || !subscription) {throw new Error("event or subscription not found")}

    //generating HMAC signature:
    const signature = generateHmac(subscription.secret, payload);
    
    const response = await fetch(subscription.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Event-Id": event.id,
            "X-Signature": signature
        },
        body: JSON.stringify(payload)
    })
    

    await prisma.deliverylog.create({
        data: {
            eventId:event.id,
            subscriptionId: subscription.id,
            attempt,
            status: response.ok ? "SUCCESS" : "FAILED",
            responseStatus : response.status
        }
    })
    if(!response.ok) {throw new Error(`Webhook failed with status ${response.status}`)}

    return {
        success: true, 
        status: response.status
    }
}

// 1. fetch event
// 2. fetch subscription
// 3. generate signature
// 4. send HTTP request
// 5. log result
