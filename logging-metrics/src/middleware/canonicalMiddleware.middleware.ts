import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../lib/logger.js";



export function canonicalRequestLogger(req: Request, res: Response, next: NextFunction){
    const incomingRequest = req.headers["x-request-id"];
    const headerId = Array.isArray(incomingRequest) ? incomingRequest[0] : incomingRequest;
    const requestId = String(req.id ?? ((headerId && headerId.trim()) || randomUUID()))
    req.id = requestId //attaching because /buy and errorHandler needs to read it from req
    res.setHeader("x-request-id", requestId);

    req.log = logger.child({
        requestId, 
        method: req.method,
        path: req.path
    })
//--------------

    const start = process.hrtime.bigint();
    
//--------------
    req.log.info({event: "http.request.started"},
        "HTTP request started"
    )    
    res.on("finish", ()=>{
            const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
            if (req.path === "/health") {return};

            //else:
            req.log.info({
                event: "http.request.completed",
                statusCode: res.statusCode,
                durationMs: Number(durationMs.toFixed(2))
            }, "HTTP request completed")

    })
    next();
}
