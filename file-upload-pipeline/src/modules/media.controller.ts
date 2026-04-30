import type { Request, Response, NextFunction } from "express";
import { optimiseImage } from "../utils/image.js";
import { uploadToCloudinary , deleteFromCloudinary} from "../services/media.service.js";  
import {prisma} from "../config/prisma.js"
import { magicNumberValidater } from "../utils/file.js";
import {  blurHashGenerator  } from "../utils/image.js";
import { demoLog } from "../utils/logger.js";

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
//upload the profile pic -> gain from req, , optimise it via sharp in sharp.ts , optimise via blurHash , start cloudinary upload. meanwhiel, check if alr exists and dlt that, update user in our db asw
export const uploadProfilePicture= async (req: Request, res:Response, next:NextFunction)=>{
    try {
        if(!req.file){
            return res.status(400).json({error: "no image provided"})
        }
        demoLog.banner("SMALL UPLOAD: profile-picture");
        demoLog.info("SMALL", "Request received", { method: req.method, path: req.path });
        demoLog.step("SMALL", "Loaded file into memory", { mime: req.file.mimetype, bytes: req.file.size });

        const userId = await getOrCreateUser() //in production we get this from auth middleware
        demoLog.info("SMALL", "Resolved user", { userId });

        //raw hex magic number check:
        demoLog.step("SMALL", "Magic number validation start");
        const isItActuallyImageQuestionMark = await magicNumberValidater(req.file.buffer);
        if(!isItActuallyImageQuestionMark){
            demoLog.warn("SMALL", "Magic number validation failed");
            return res.status(415).json({error: `sike, thats the wrong backend`})
        }
        demoLog.ok("SMALL", "Magic number validation passed");
        
        //parallel processing, wrap sharp and blurhash into one promise
        demoLog.step("SMALL", "Sharp optimize + BlurHash start");
        const [bufferOptimisedImage, blurHashFeederString] = await Promise.all([optimiseImage(req.file.buffer), blurHashGenerator(req.file.buffer)])
        demoLog.ok("SMALL", "Sharp optimize + BlurHash complete", { outBytes: bufferOptimisedImage.byteLength, blurHashLen: blurHashFeederString.length });

        //else, we continue:
        const cloudinaryUpload = await uploadToCloudinary(bufferOptimisedImage, "profile-pictures")
        demoLog.ok("SMALL", "Uploaded to Cloudinary", { publicId: cloudinaryUpload.publicId })

        
        //asset managemet: we find if any old img alr exists, destroy it to prevent storage pile up in cloudinary
        const user = await prisma.user.findUnique({where: {id: userId}})
        if(user?.publicId){
            demoLog.step("SMALL", "Old asset found; deleting previous Cloudinary resource", { oldPublicId: user.publicId });
            await deleteFromCloudinary(user.publicId);
        }

        //db stuff:
        demoLog.step("SMALL", "DB update start (user profile media)");
        const updatedUser = await prisma.user.update({
            where : {id: userId},
            data: {
                fileUrl: cloudinaryUpload.fileUrl,
                publicId: cloudinaryUpload.publicId,
                blurHashString: blurHashFeederString
            }
        })
        demoLog.ok("SMALL", "DB update complete", { userId: updatedUser.id, publicId: updatedUser.publicId });

        return res.status(200).json({
            message: `profile picture updated succesfulleh`,
            data:  {
                fileUrl : updatedUser.fileUrl,
                publicId: updatedUser.publicId,
                blurHash: updatedUser.blurHashString
            }
        })

        
    } catch (err) {
        next(err) 
    }


}
