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
//2: webhook controller: takes in the rawbody and the provider from req, does whatever is needed w it (verify signature of incoming webhook, idempotency check , stores event, enqueues the job) -> currently contains all the things which will happen with the webhook once received (verification etc etc, to be refactored later on)
//bonus: idempotency syste: prevents duplicate processing of same webhook (event @unique in prisma, while prisma inserting -> if duplicate -> error)  (prisma gives P2002 erorr if repeated thing)
//therefore, we have db-level idempotency -> instead of if(exists) -> skip ,  we implement: insert -> DB enforces uniqueness
// 1: in webhook routes: why express.raw? HMAC related signature verificatoin needs: HMAC(secret, raw_body) and hence not json parsing it

//3: enqueue event -> worker might fail because of temporary DB issue, redis issue, or network glitch, therefore trying the job 3 times max, if it keeps failing, we mark it as fial
//backoff: without backoff retry happens immediately, exponential backoff means delay in retry = 2^attempt. therefore 1st attempt after 1 sec, 2nd after 2s, 3rd after 4s
//why exponential decay better/ gives system time to recover, reduces load during failure spikes
//why switch(type) in worker.ts ? because scalable, right now implemented only for payment , later for other providers asw

//fraud logic -> only two rules in this repo, real systems might user per-user tracking/velocity checks/ip and device fingerprintign / ML models / etc
//rule 2 in fraud detection rules is basically burst detection logic
