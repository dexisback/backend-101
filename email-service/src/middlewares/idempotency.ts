import type { Request, Response, NextFunction } from "express";
import {prisma} from "../config/prisma.js"
import { logError, logWarn } from "../utils/logger.js";



export default async function idempotencyChecker(req: Request, res: Response, next: NextFunction){
    const key = req.headers['idempotency-key'] as string;
    if(!key) { return next() }
    try {
        const currentRequest = await prisma.idempotencyKey.findUnique({
            where: { key }
        })

        if(currentRequest && currentRequest.responseBody){
            return res.status(currentRequest.responseStatus || 200).json(currentRequest.responseBody)
        }
        if(currentRequest && !currentRequest.responseBody){
            logWarn("Idempotency key replay while original request is still in progress", { key });
            return res.status(409).json({
                success: false,
                message: "Request with this idempotency-key is already in progress. Retry shortly."
            });
        }
        if(!currentRequest ){
            await prisma.idempotencyKey.create({
                data: { key }
            })
        }

        const originalJSON = res.json.bind(res);

        res.json = (body: any) => {
            const statusCode = res.statusCode;
            void prisma.idempotencyKey.update({
                where: { key },
                data: {
                    responseBody: body,
                    responseStatus: statusCode
                }
            }).catch((err)=>{
                logError("Failed to persist idempotency response", { key, error: String(err) })
            })

            return originalJSON(body);
        }

        next()


    } catch (err) {
        logError("Error in idempotency middleware", { error: String(err), key });
        next(err)
    }
}
