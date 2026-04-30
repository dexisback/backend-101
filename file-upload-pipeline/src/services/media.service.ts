import cloudinary from "../config/cloudinary.js";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { demoLog } from "../utils/logger.js";

interface UploadResult {
    fileUrl: string;
    publicId: string;
}
//upload and delete to cloudinary logic 
export const uploadToCloudinary = (buffer: Buffer, folder: string = "amaan-uploads"): Promise<UploadResult> => {
    return new Promise((resolve, reject)=>{
        demoLog.step("SMALL", "Cloudinary upload start", { folder, bytes: buffer.byteLength });
        //create upload stream:
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error: UploadApiErrorResponse | undefined , result: UploadApiResponse | undefined) => {
                if(error) {
                    demoLog.err("SMALL", "Cloudinary upload failed", { message: error.message, http_code: (error as any).http_code });
                    return reject(error);
                }
                if(!result){return reject(new Error("cloudinary upload failed"))}
                    if(result) {
                    demoLog.ok("SMALL", "Cloudinary upload complete", { publicId: result.public_id });
                    resolve({
                        fileUrl: result.secure_url,
                        publicId: result.public_id
                    })
                }
            }
        );
        uploadStream.on("error", reject);
        uploadStream.end(buffer) //this actually sends my image bytes
    })
}



export const deleteFromCloudinary = async (publicId: string): Promise <void> => {
    demoLog.step("SMALL", "Cloudinary destroy start", { publicId });
    await cloudinary.uploader.destroy(publicId)
    demoLog.ok("SMALL", "Cloudinary destroy complete", { publicId });
}




//self notes: cloudinary.uploader.upload_stream(options, callbacK) rerusn a writeable stream
//we must write image bytes to that stream,usually by calling uploadStream.end(buffer)
//then callback runs when upload completes or fails (runs error , or result )
