import express from "express";


import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { logger } from "./lib/logger.js";
import responseTime from "response-time";   //external lib to calculate response time 
const app =express();
app.use(express.json());

app.use(responseTime());
//request logger middleware:
app.use(requestLogger)


app.get("/health", (req, res)=>{
    res.json({status: "ok"})
})

let remainingTickets = 1000  //To-DO: change to generalised⚠️

export function getTickets() {
    return remainingTickets
}


export function buyTicket(){
    if(remainingTickets <= 0 ){
        return null
    }

    remainingTickets--
    return {
        ticketId: `ticket_${remainingTickets}`
    }
}


app.get("/ticket", (req, res)=>{
    const remaining = getTickets();
    logger.info({remaining_tickets: remaining}, "Ticket count checked")
    res.json({ remaining })
})



app.post("/buy", (req, res)=>{

    const ticket = buyTicket();
    if(!ticket ){
        res.status(400).json({message: "no tickets remaining"})
        logger.warn({
            event: "purchase_failed_sold_out"
        }, "no ticket left" )
        return
    }
    //else we buy a ticket ( function )
    logger.info({
        event: "ticket_purchased",
        ticketId : ticket.ticketId
    }, "Ticket succesfully bought")
    res.json({status: "success", ticketId : ticket?.ticketId})
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