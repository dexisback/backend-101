import type { Request, Response, NextFunction } from "express";
export const errorHandlerMiddleware = (
    err: unknown, 
    _req: Request,
    res: Response,
    _next: NextFunction 
) => {
    const message = err instanceof Error ? err.message : "Internal server error "
    res.status(500).json({ error: message })
}
