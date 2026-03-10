//generates request Id , 
//logs request start
// log requests completion
// measures duration


import { randomUUID } from "node:crypto";
import type {Request, Response, NextFunction} from "express";
import { logger } from "../lib/logger.js";



export function requestLogger(req: Request, res:Response, next:NextFunction){
    const requestId = randomUUID();
    const startTime = Date.now();
    (req as any) = requestId;

    logger.info({
        event: "request_received",
        requestId,
        method: req.method,
        route: req.originalUrl
    })

    res.on("finish", ()=>{
        const duration = Date.now() - startTime;
        logger.info({
            event: "request_completed",
            requestId,
            method: req.method,
            rotue: req.originalUrl,
            status: res.statusCode,
            durationMs: duration
        })
    })

    next();
}


//this would print out some log like:
// {
//   "event": "request_completed",
//   "requestId": "req123",
//   "status": 200,
//   "durationMs": 45
// }
