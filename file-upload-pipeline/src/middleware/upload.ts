//this ensures that only valid, safe data reaches the controller

//rnL confgigures multer to hold files in ram (memoryStorage), set a strict size limit

import multer from "multer"
import { demoLog } from "../utils/logger.js";



const RAMstorage= multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback ) =>{
    demoLog.step("SMALL", "Multer received file", { field: file.fieldname, mime: file.mimetype, bytes: file.size });
    if(file.mimetype.startsWith("image/")){
        cb(null, true)
    }
    else{
        demoLog.warn("SMALL", "Rejected by mimetype pre-check", { mime: file.mimetype });
        cb(new Error("INVALID_FILE_TYPE"))
    }
}

export const uploadMiddleware = multer({
    storage: RAMstorage,
    limits: {fileSize: 5*1024*1024}, //5mb limit prevents ram exhaustion
    fileFilter 

})
