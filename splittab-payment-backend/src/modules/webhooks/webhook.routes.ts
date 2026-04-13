import { Router } from "express";
import express from "express"


import { razorpayWebhookHandler } from "./webhook.controller.js";
import { ipWhitelistMiddleware } from "../../shared/middlewares/ipWhitelist.middleware.js";
import { hmacVerifyMiddleware } from "../../shared/middlewares/hmacVerify.middleware.js";

const router = Router();


// router.post("/razorpay", express.raw({ type: "application/json" }), razorpayWebhookHandler)


router.post("/razorpay", express.raw({type: "application/json"}),
    ipWhitelistMiddleware,
    hmacVerifyMiddleware,
    razorpayWebhookHandler
)

export default router;
