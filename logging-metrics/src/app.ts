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
    res.json({ remaining })
})



app.post("/buy", (req, res)=>{
    const ticket = buyTicket();
    if(!ticket ){
        res.status(400).json({message: "no tickets remaining"})
        return
    }
    //else we buy a ticket (function )
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