import type { Request, Response, NextFunction } from "express";

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    // req.log.error({
    //     event: "unhandled_error",
    //     error: err.message ,
    //     stack: err.stack,
    //     requestId: String(req.id)
    // })

    //canonical:
    req.log.error({
        event: "http.request.error",
        requestId: String(req.id),
        method: req.method,
        path: req.path,
        statusCode: 500,
        error: err?.message,
        stack: err?.stack
    }, "Unhanded error")

    res.status(500).json({
        message: "internal server error"
    })
}




