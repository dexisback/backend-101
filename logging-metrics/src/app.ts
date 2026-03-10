import express from "express";

import type { NextFunction, Request, Response } from "express";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { logger } from "./lib/logger.js";
import responseTime from "response-time";   //external lib to calculate response time 
import { globalErrorHandler } from "./middleware/globalErrorHandler.middleware.js";
import { register } from "./metrics/metrics.js";
const app =express();
app.use(express.json());

app.use(responseTime());
//global erorr handler middleware:
app.use(globalErrorHandler)
//request logger middleware:
app.use(requestLogger)



//prom-metric expose:
app.get("/metrics", async(req:Request, res:Response)=>{
    res.set("Content-Type", register.contentType)
    res.end(await register.metrics())
})


app.get("/health", (req, res)=>{
    res.json({status: "ok"})
})

let remainingTickets = 1000  //To-DO: change to generalised⚠️

export function getTickets() {
    return remainingTickets
}


export function buyTicket(){
    if(remainingTickets <= 0 ){
        logger.warn({
            event: "tickets_sold_out"
        })
        return null
    }

    remainingTickets--
    return {
        ticketId: `ticket_${remainingTickets}`
    }
}

export function extractUserId(req: Request): string | undefined {
    //wjen you try hard is when you die hard
    const data = req.header("x-user-id");
    if(!data){
        return;
        //Todo: warn ? ⚠️
    }
    //else
        const userId = data?.trim() //whitespace:
        return userId
}




app.get("/ticket", (req, res)=>{
    const remaining = getTickets();
    logger.info({
        event: "tickets_checked",
        remainingTickets: remaining
    }, "Ticket count checked")
    res.json({ remaining })
})



app.post("/buy",  (req: Request, res: Response)=>{
    //first authenticate user via function made
    const userId = extractUserId(req);
    if(!userId){
                    res.status(400).json({message: "no user id found"});

        logger.warn({
            event: "user_not_found"            
        }, "userId not attached")
        return; 
    }

    const ticketId = buyTicket();
    //improvement: bought a ticket, so logger.info, if ticket fails we dont care we have warn anyways. but this should be broadcasted
    logger.info({
        event: "ticket_purchased",
        requestId: userId,
        ticketId: ticketId
    }, "1 ticket purchase attempt")
    if(!ticketId ){
        res.status(400).json({message: "no tickets remaining"})
        logger.warn({
            event: "purchase_failed_sold_out"
        }, "no ticket left" )
        return
    }
    //else we buy a ticket ( function )
    logger.info({
        event: "ticket_purchased",
        ticketId : ticketId.ticketId
    }, "Ticket succesfully bought")
    res.json({status: "success", ticketId : ticketId?.ticketId})
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