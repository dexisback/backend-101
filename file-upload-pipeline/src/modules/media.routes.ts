import { Router } from "express";
import { uploadMiddleware } from "../middleware/upload.js";
import { uploadProfilePicture } from "./media.controller.js";
import { validateSchema } from "../middleware/validate.js";
import { profilePictureUploadSchema } from "./media.schema.js";

const router = Router();



router.post("/profile-picture", uploadMiddleware.single('profile-picture'), validateSchema(profilePictureUploadSchema),uploadProfilePicture)


export default router; //self mistake: i always end up exporting Router, export router the instance 


//NOTE: zod validator must run after multer, if it runs before req.body will be empty because the form-data hasnt been parsed yet  
