import type { Request, Response, NextFunction } from "express";
import {prisma} from "../config/prisma.js"



export default async function idempotencyChecker(req: Request, res: Response, next: NextFunction){
    const key = req.headers['idempotency-key'] as string;
    if(!key) { return next() }
    try {
        const currentRequest = await prisma.idempotencyKey.findUnique({
            where: { key }
        })

        if(currentRequest && currentRequest.responseBody){ return res.status(currentRequest.responseStatus || 200).json(currentRequest.responseBody)}
        if(!currentRequest ){
            await prisma.idempotencyKey.create({
                data: { key }
            })
        }

        const originalJSON = res.json;

        res.json = (body: any) => {
            prisma.idempotencyKey.update({
                where: { key },
                data: {
                    responseBody: body,
                    responseStatus: res.statusCode
                }
            }).catch((err)=>{console.error("Failed to update idempotency key", err)})

            return originalJSON.call(res, body)
        }

        next()


    } catch (err) {
        console.error( "error in checking idempotency key in middleware",err)
        next(err)
    }
}

