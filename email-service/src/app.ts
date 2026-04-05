import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import idempotencyChecker from "./middlewares/idempotency.js";
import notification from "./modules/notifications/notification.routes.js"
import webhookRoutes from "./modules/webhooks/webhook.routes.js"

const app: Application = express();
app.use(express.json())

app.get("/health", (req: Request, res: Response)=>{
    res.status(200).json({status: "OK", timeStamp: new Date().toISOString()})
})



app.use("/api/v1/notifications", notification);
app.use("/api/v1/webhooks", webhookRoutes);



app.use((err: any, req: Request, res: Response, next: NextFunction)=>{
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message : err.message || "internal server error"
    })
})


export default app