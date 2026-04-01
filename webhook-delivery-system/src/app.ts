
import Fastify from "fastify"
import { subscriptionRoute } from "./modules/subscription/subscription.routes.js"
import {eventRoutes} from "./modules/event/event.routes.js"
export const app = Fastify({
    logger: true
})



app.register(subscriptionRoute)
app.register(eventRoutes)





//self notes: 
//express vs fastify -> route registration , in express: app.post("/subscription", handler) in fastify app.post("/subscription", async (request, reply)=>{}) so you dont need any handler and usme async bananna=> you directly can add the logic in there 
//no more res.status().json()  -> res.status().send() or just return data     -> fastify auto handles serialisation
//replay system: what this does is resend the final same event to all matching subscriptions
// POST /events/:id/replay   -> resends the same event to all matching subscriptions


