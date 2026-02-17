import type { Request, Response, NextFunction} from "express";


export const errorMiddleware = (
    err: Error, 
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    console.error("Error is:", err);
    res.status(500).json({
        success: false,
        error: err.message || "Internal server error"

    })
 }

 //high level explanation: when any route throws an error and asyncHandler catches it, the error lands here
 //route throws error > asyncHandler catches it and throws to this file by calling next(error) > this function responds to the client