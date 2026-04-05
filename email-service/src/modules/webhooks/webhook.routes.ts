import { Router } from "express";
import { resendWebhookHandler } from "./webhook.controller.js";
const router= Router();


router.post("/resend", resendWebhookHandler)


export default router;
