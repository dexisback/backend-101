import express from "express";
import type { Request, Response } from "express";

import webhookRoutes from "./routes/webhook.route.js"
const app = express();


//we are NOT using express.json parsing because webhooks we'll scope ourselves

app.use("/webhook", webhookRoutes)
//now can use json parsing for normal routes
app.use(express.json())

app.get("/", (_req: Request, res: Response)=>{
    res.send("ok running ")
}) //no req just sending

export default app;


//self notes below:
//1: webhook route: exposes a general :provider route, this provider can be anything (stripe/razorpay/github cicd/etcetc) , middleware runs before controller, stores the raw body needed for signature verification, webhookHandler is the final function which handles whatever actually happens with the incoming webhook (in webhook controller (actual handling logic lies her))
//2: webhook controller: takes in the rawbody and the provider from req, does whatever is needed w it (verify signature of incoming webhook, idempotency check , stores event, enqueues the job)
// 1: in webhook routes: why express.raw? HMAC related signature verificatoin needs: HMAC(secret, raw_body) and hence not json parsing it
