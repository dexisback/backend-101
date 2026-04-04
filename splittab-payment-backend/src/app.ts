import express from "express"
import cors from "cors"

import type { Request, Response,Application } from "express"

const app: Application = express();



//global middleware:
app.use(cors())

app.use(express.json())

//health route:
app.get("/health", (req: Request, res: Response)=>{
    res.status(200).json({status: "ok", timeStamp: new Date()})
})


//TODO: routes here later ⚠️⚠️⚠️⚠️


export default app;
