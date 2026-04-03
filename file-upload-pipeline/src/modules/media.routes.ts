import { Router } from "express";
import { uploadMiddleware } from "../middleware/upload.js";
import { uploadProfilePicture } from "./media.controller.js";

const router = Router();



router.post("/profile-picture", uploadMiddleware.single('profile-picture'), uploadProfilePicture)


export default router; //self mistake: i always end up exporting Router, export router the instance 

 
