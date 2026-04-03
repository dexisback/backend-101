import express from "express";
import type { Request, Response, Application } from "express";
import mediaRoutes from "./modules/media.routes.js"
import { globalErrorHandler } from "./middleware/error.js";
import largeFileRoutes from './modules/largeFile.rotues.js';
import webhookRoutes from './modules/webhooks/webhook.routes.js';

const app: Application = express();


app.use(express.json({limit: "10kb"}));
app.use(express.urlencoded({ extended: true, limit: "10kb"}))  //idk man, funnily enough i learnt this loc in my web dev class in college(they teach ajax and jquery)



app.get("/health", (_req: Request, res: Response)=>{
    res.status(200).json({
        status: "OK",
        message: "alive"
    })
})


app.use("/api/media", mediaRoutes)
app.use("/api/media", largeFileRoutes ) //signature generator
app.use("/api/webhooks", webhookRoutes) //cloudinary webhook receiver

app.use(globalErrorHandler)

export default app;
