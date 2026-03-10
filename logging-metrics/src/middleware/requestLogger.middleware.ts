//A request logger intercepts every single incoming request, measures how long it takes to process, and automatically logs details like the HTTP method (GET/POST), the URL, the status code, and the response time. 
// This is critical for measuring 
// latency during your k6 load tests.
import type {Request, Response, NextFunction} from "express";
import {pinoHttp} from "pino-http";
import { logger } from "../lib/logger.js";
//pinoHttp automatically has many things like req, res in built. no manual logic to log


export const requestLogger = pinoHttp({
    logger: logger,
    autoLogging: {
        //this prevents k6 from flooding logs
        ignore : (req: Request) => req.url === "/health"
    },
    //optional: customise the success msg to be cleaner
    customSuccessMessage: function(req:Request, res:Response, responseTime: number) {
        return `method -> ${req.method}   url -> ${req.url}  time -> ${responseTime}ms`
    }

})