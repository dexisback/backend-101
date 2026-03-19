//A request logger intercepts every single incoming request, measures how long it takes to process, and automatically logs details like the HTTP method (GET/POST), the URL, the status code, and the response time. 
// This is critical for measuring 
// latency during your k6 load tests.
import type {Request, Response, } from "express";
import {pinoHttp} from "pino-http";
import { logger } from "../lib/logger.js";
//pinoHttp automatically has many things like req, res in built. no manual logic to log
//using  requestId ( new )
import {randomUUID} from "node:crypto"


export const requestLogger = pinoHttp({
    logger: logger,
    // autoLogging: {
    //     //this prevents k6 from flooding logs
    //     ignore : (req: Request) => req.url === "/health"
    // },
    // //optional: customise the success msg to be cleaner
    // customSuccessMessage: function(req:Request, res:Response, responseTime: number) {
    //     return `method -> ${req.method}   url -> ${req.url}  time -> ${responseTime}ms`
    // }

    //using requestId:
    genReqId: (req:Request, res:Response) => {
        const incomingRequest = req.headers["x-request-id"];   //fetch requestid from headers (if )
        const headerId = Array.isArray(incomingRequest) ? incomingRequest[0] : incomingRequest;
        const requestId = (headerId && headerId.trim() || randomUUID());   //else generate and give it a random UUID


        res.setHeader("x-request-id", requestId);   //attach headers me requestId back
        return requestId;
    },

    customProps: (req)=>({
        requestId: req.id
    }),
    autoLogging: {
        ignore: (req: Request)=> req.url ==="/health",

    },
    customSuccessMessage: (req: Request, res: Response, responseTime: number)=>{   return `method -> ${req.method}   url -> ${req.url}  time -> ${responseTime}ms`}

})