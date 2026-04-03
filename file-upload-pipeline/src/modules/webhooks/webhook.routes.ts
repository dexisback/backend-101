import { Router } from "express";
import { cloudinaryWebhookHandler } from "./webhook.controller.js";
const router= Router();




router.post("/cloudinary", cloudinaryWebhookHandler)


export default router;


