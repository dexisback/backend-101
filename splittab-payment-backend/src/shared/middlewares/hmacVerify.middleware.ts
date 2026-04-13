import type { Request, Response, NextFunction } from "express";
import { razorpaySignatureVerifier } from "../utils/signature.js";

export const hmacVerifyMiddleware = (req: Request, res: Response, next: NextFunction) =>{
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if(!secret || !signature || typeof signature !=="string") {
        return res.status(400).json({ error: "Missing signature/secret" })
    }

    const ok = razorpaySignatureVerifier(req.body, signature, secret);
    if(!ok) {
        return res.status(400).json({ error: "Invalid signature" })
    }
    next();
}
