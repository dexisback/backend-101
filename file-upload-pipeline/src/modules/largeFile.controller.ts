import type { Request, Response, NextFunction } from "express";
import {prisma} from "../config/prisma.js"
import { secureSignatureGenerator } from "../services/signature.service.js";
import { env } from "../config/env.js"

const getOrCreateUser = async () => {
    const existingUser = await prisma.user.findFirst({ select: { id: true } });
    if (existingUser) return existingUser.id;

    const newUser = await prisma.user.create({
        data: {
            email: `dev-user-${Date.now()}@local.test`,
            name: "Dev User"
        },
        select: { id: true }
    });

    return newUser.id;
}

export const getUploadSignature = async (req: Request, res: Response, next: NextFunction)=> {
    try {
        const userId = await getOrCreateUser()  //in real system received from auth middleware
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
                timestamp: timeStamp,
                folder: uploadParams.folder,
                context: uploadParams.context,
                mediaId: pendingMedia.id
            
            
            }
        })
    } catch (err) {
        next(err)
    }
}

export const getLargeMediaStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mediaId } = req.params;
        if (!mediaId || Array.isArray(mediaId)) {
            return res.status(400).json({ error: "invalid media id" });
        }

        const media = await prisma.largeMedia.findUnique({
            where: { id: mediaId }
        });

        if (!media) {
            return res.status(404).json({ error: "media not found" });
        }

        return res.status(200).json({
            message: "status fetched",
            data: media
        });
    } catch (err) {
        next(err);
    }
}

