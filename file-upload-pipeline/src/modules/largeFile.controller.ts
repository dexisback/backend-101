import type { Request, Response, NextFunction } from "express";
import {prisma} from "../config/prisma.js"
import { secureSignatureGenerator } from "../services/signature.service.js";
import { env } from "../config/env.js"


export const getUploadSignature = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const userId = "simulated-user-uuid"  //in real system received from auth middleware
        //we need a placeholder record in db first
        const pendingMedia = await prisma.largeMedia.create({
            data: {userId, status: "PENDING"}
        })
        //generating the timestamp and signature:
        const timeStamp = Math.round(new Date().getTime()/1000);
        const {signature, uploadParams} = secureSignatureGenerator({
            timeStamp, 
            folder: `application-large-files`,
            mediaId: pendingMedia.id
        })
        //hand the exact payload the FE needs to upload directly
        return res.status(200).json({
            message: `signature generated!`,
            data: {
                uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/upload`,
                apiKey: env.CLOUDINARY_API_KEY,
                signature,
                timeStamp,
                folder: uploadParams.folder,
                context: uploadParams.context,
                mediaId: pendingMedia.id
            
            
            }
        })
    } catch (err) {
        next(err)
    }
}



