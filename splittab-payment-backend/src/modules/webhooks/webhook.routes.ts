import { Router } from "express";
import express from "express"


import { razorpayWebhookHandler } from "./webhook.controller.js";

const router = Router();


router.post("/razorpay", express.raw({ type: "application/json" }), razorpayWebhookHandler)

export default router;
