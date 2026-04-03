//meant for large files:

import { timeStamp } from "node:console"
import cloudinary from "../config/cloudinary.js"
import { env } from "../config/env.js"


interface signatureParams {
    timeStamp: number, 
    folder: string,
    mediaId: string //the id of the pending row in our db
}

export const secureSignatureGenerator = ({timeStamp, folder, mediaId}: signatureParams) =>{
    //define the strict rules the upload MUST follow:
    const uploadParams = {
        timeStamp,
        folder,
        allowedFormats : ['mp4', 'mov', 'webm'], //cloudinary rejects anything else
        context: `mediaId = ${mediaId}`     // Hidden metadata for our Webhook

    }
    const signature = cloudinary.utils.api_sign_request(uploadParams, env.CLOUDINARY_API_SECRET)
    return { signature, uploadParams }
}

