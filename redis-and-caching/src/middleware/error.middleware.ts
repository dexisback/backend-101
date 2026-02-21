import type { Request, Response, NextFunction } from "express";
import ApiResponse from "../utils/apiResponse.js";
import { ZodError } from "zod";

export function errorMiddleware(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    
    //case 1:
    if(err instanceof ZodError){
        return res.status(400).json(ApiResponse.error("invalid request data", 400))
    }


    //else:
    console.error(err)
    return res.status(500).json(ApiResponse.error("ineternal server error", 500))

}
