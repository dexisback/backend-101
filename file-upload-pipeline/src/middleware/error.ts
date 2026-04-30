import type { Request, Response, NextFunction } from "express";

import multer from "multer";
import { demoLog } from "../utils/logger.js";

export const globalErrorHandler = (
    err: Error,
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    demoLog.err("API", "Unhandled error", { message: err.message, method: req.method, path: req.path })
    console.error(`Error is , ${err.message}`)

 if(err instanceof multer.MulterError){
    if(err.code == "LIMIT_FILE_SIZE" ) {    return res.status(413).json({error: "file size too large, max size = 5mb!!"})} //specifying the error for file size
return res.status(400).json({error: err.message})
}
if(err.message === "INVALID_FILE_TYPE") {
    return res.status(415).json({error: "unsupported media type. images only"})
}
return res.status(500).json({error: "internal server error"})
}

