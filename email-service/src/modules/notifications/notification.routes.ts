import { Router } from "express";
import { notificationSender } from "./notification.controller.js";
import idempotencyChecker from "../../middlewares/idempotency.js";
import tenantRateLimiter from "../../middlewares/rateLimiter.js";




const router= Router();



router.post("/notify", tenantRateLimiter, idempotencyChecker, notificationSender)

export default router;



