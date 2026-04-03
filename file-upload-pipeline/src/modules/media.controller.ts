import type { Request, Response, NextFunction } from "express";
import { optimiseImage } from "../utils/image.js";
import { uploadToCloudinary , deleteFromCloudinary} from "../services/media.service.js";  
import {prisma} from "../config/prisma.js"
import { magicNumberValidater } from "../utils/file.js";
import {  blurHashGenerator  } from "../utils/image.js";
//upload the profile pic -> gain from req, , optimise it via sharp in sharp.ts , optimise via blurHash , start cloudinary upload. meanwhiel, check if alr exists and dlt that, update user in our db asw
export const uploadProfilePicture= async (req: Request, res:Response, next:NextFunction)=>{
    try {
        if(!req.file){
            return res.status(400).json({error: "no image provided"})
        }
        const userId = "dummy-user-uuid" //in production we get this from auth middleware

        //raw hex magic number check:
        const isItActuallyImageQuestionMark = await magicNumberValidater(req.file.buffer);
        if(! isItActuallyImageQuestionMark){return res.status(415).json({error: `sike, thats the wrong backend`})}
        
        //parallel processing, wrap sharp and blurhash into one promise
        const [bufferOptimisedImage, blurHashFeederString] = await Promise.all([optimiseImage(req.file.buffer), blurHashGenerator(req.file.buffer)])

        //else, we continue:
        const cloudinaryUpload = await uploadToCloudinary(bufferOptimisedImage, "profile-pictures")

        
        //asset managemet: we find if any old img alr exists, destroy it to prevent storage pile up in cloudinary
        const user = await prisma.user.findUnique({where: {id: userId}})
        if(user?.publicId){
            await deleteFromCloudinary(user.publicId);
        }

        //db stuff:
        const updatedUser = await prisma.user.update({
            where : {id: userId},
            data: {
                fileUrl: cloudinaryUpload.fileUrl,
                publicId: cloudinaryUpload.publicId,
                blurHashString: blurHashFeederString
            }
        })

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


