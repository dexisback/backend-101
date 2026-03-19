import type { Request, Response, NextFunction } from "express";

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    req.log.error({
        event: "unhandled_error",
        error: err.message ,
        stack: err.stack,
        requestId: String(req.id)
    })

    res.status(500).json({
        message: "internal server error"
    })
}




