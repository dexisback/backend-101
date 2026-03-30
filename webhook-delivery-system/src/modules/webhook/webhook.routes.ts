import type { FastifyInstance } from "fastify";
import { createWebhookSchema } from "./webhook.schema.js";
import { createWebhook } from "./webhook.service.js";
import { parse } from "node:path";


export async function webhookRoutes(app: FastifyInstance) {
    app.post("/webhooks", async(request, reply)=>{
        const parsed= createWebhookSchema.safeParse(request.body)
        if(!parsed.success){return reply.status(400).send({error: parsed.error})}
        //else: , create our webhook
        const webhook = await createWebhook(parsed.data)
        console.log(webhook)
        return reply.status(201).send(`webhook created ${webhook}`)
        
        
    })
}