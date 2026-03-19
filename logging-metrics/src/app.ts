import express from "express";

import type {  Request, Response } from "express";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { logger } from "./lib/logger.js";
import responseTime from "response-time";   //external lib to calculate response time 
import { globalErrorHandler } from "./middleware/globalErrorHandler.middleware.js";
import { register } from "./metrics/metrics.js";
import { totalBuyRequests, totalPurchaseFailures, ticketsRemainingGauge, buyRequestDuration } from "./metrics/metrics.js";


//because we need to use req.log.something inside of the exported functions asw, so we need to pass it inside the functions first using types
import type { Logger } from "pino";
type RequestLog = Pick<Logger, "info" | "warn" | "error" >;


const app =express();
app.use(express.json());

app.use(responseTime());

//request logger middleware:
app.use(requestLogger)




let remainingTickets = 1000  //To-DO: change to generalised⚠️

export function getTickets() {
    return remainingTickets
}

//buy ticket does NOT concern itself with logging anymore, every logging would be done inside of GET endpoint 
export function buyTicket(){
    if(remainingTickets <= 0 ){      return null}
    //else:
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




//   ----------------- ENDPOINTS -------------------

// req.log is a child logger created for that specific HTTP request by pino-http.
// So every req.log.info(...) in that handler automatically carries that request’s metadata (especially req.id / your request_id).

//prom-metric expose:     
app.get("/metrics", async(req:Request, res:Response)=>{
    res.set("Content-Type", register.contentType)
    res.end(await register.metrics())
})


app.get("/health", (req, res)=>{
    res.json({status: "ok"})
})



app.get("/ticket", (req: Request, res: Response)=>{
    const remaining = getTickets();

    req.log.info({
        event: "tickets_checked",
        remainingTickets: remaining
    }, "Ticket count checked")
    res.json({ remaining })
})


//ADD: buyRequestsTotal.inc()⚠️ , TRACK LATENCY, TRACK FAILURES, UPDATE REAMINING TICKETS 
app.post("/buy",  (req: Request, res: Response)=>{
    const requestId = String(req.id) //from pino-http
    const end = buyRequestDuration.startTimer()

    let status = "failed"    //default assumption, for using it inside finally we need to store status as a variable asw

    try {

    //first authenticate user via function made
    const userId = extractUserId(req);
    if(!userId){
        totalBuyRequests.labels("failed").inc();
        totalPurchaseFailures.labels("missing_user").inc()
                    res.status(400).json({message: "no user id found"});

        req.log.warn({
            event: "user_not_found", requestId            
        }, "userId not attached")
        return; 
    }

    const ticketId = buyTicket();  
    //changed; logger.info changed to req.log.info. //in /buy endpoint, userId and requestId need to be separate because of obvious reasons
    req.log.info({
        event: "ticket_purchase_attempt",
        userId: userId,
        requestId, //earlier requestId was marketed as userId (fake gimmick idk why)
        ticketId: ticketId
    }, "1 ticket purchase attempt")
    if(!ticketId ){
            totalBuyRequests.labels("failed").inc()
          totalPurchaseFailures.labels("sold_out").inc()

        res.status(400).json({message: "no tickets remaining"})
        
    req.log.warn({
            event: "purchase_failed_sold_out", requestId
        }, "no ticket left" )
        return
    }

    totalBuyRequests.labels("success").inc()   //this is the success path:
    ticketsRemainingGauge.set(getTickets());
    status = "success" //set status as success if it goes down success path (to use this as a variable inside of finally )
    //else we buy a ticket ( function )
req.log.info({
        event: "ticket_purchased", requestId,
        ticketId : ticketId.ticketId
    }, "Ticket succesfully bought")
    res.json({status: "success", ticketId : ticketId?.ticketId})
    }

    finally {
        end( {status})
    }
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




// fix: global erorr handler middleware should be in the last
app.use(globalErrorHandler)
