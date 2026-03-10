import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    logger.error({
        event: "unhandled_error",
        error: err.message ,
        stack: err.stack
    })

    res.status(500).json({
        message: "internal server error"
    })
}




//this ensures pino caputes unknown erorrs and stack traces
