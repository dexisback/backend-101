//first tym jai ho:



import Fastify from "fastify"
import { webhookRoutes } from "./modules/webhook/webhook.routes.js"

export const app = Fastify({
    logger: true
})



app.register(webhookRoutes)





//self notes: 
//express vs fastify -> route registration , in express: app.post("/webhooks", handler) in fastify app.post("/webhooks", async (request, reply)=>{}) so you dont need any handler and usme async bananna=> you directly can add the logic in there 
//no more res.status().json()  -> res.status().send() or just return data     -> fastify auto handles serialisation
