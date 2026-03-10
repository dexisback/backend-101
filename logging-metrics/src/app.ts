import express from "express";


import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { logger } from "./lib/logger.js";

const app =express();
app.use(express.json());


//request logger middleware:
app.use(requestLogger)


app.get("/health", (req, res)=>{
    res.json({status: "ok"})
})
const PORT = 3000

app.listen(PORT, ()=>{
    logger.info({
        event: "server_started",
        port: PORT
    })
})


//example startup log :
// {
//     "event": "server started",
//     "port": 3000
// }