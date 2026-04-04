import express from "express"
import cors from "cors"

import type { Request, Response,Application } from "express"

const app: Application = express();

//route imports:
import tabRoutes from "./modules/tabs/tab.routes.js"
import splitRoutes from "./modules/splits/split.routes.js"
import webhookRoutes from "./modules/webhooks/webhook.routes.js"
//global middleware:
app.use(cors())

app.use("/api/webhooks", webhookRoutes) //we use webhook route before express.json so that the raw body is not parsed into an object prematurely 
app.use(express.json())

//health route:
app.get("/health", (req: Request, res: Response)=>{
    res.status(200).json({status: "ok", timeStamp: new Date()})
})


//TODO: routes here later ⚠️⚠️⚠️⚠️
app.use("/api/tabs", tabRoutes)
app.use("/api/splits", splitRoutes)



export default app;
