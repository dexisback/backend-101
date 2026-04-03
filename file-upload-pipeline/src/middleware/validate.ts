import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodTypeAny } from "zod";

export const validateSchema = (schema: ZodTypeAny) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            })
            next();

           } catch (err) {
            if(err instanceof ZodError) {
                return res.status(400).json({
                    error: "Validation failed",
                })
            }        
        next(err)
        }
        
    }
}
