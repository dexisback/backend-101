import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export const authMiddleWare = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            error: "Access token required, or the access token is incorrect"
        })
        return
    }
    //now yaha se the good ol way of extracting token and then using it
    const token = authHeader.split(" ")[1]
    if (!token) {
        res.status(401).json({
            success: false,
            error: "Access token missing"
        })
        return
    }
    try {
        const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as unknown as { userId: string }
        //@ts-ignore adding userId to req object:
        req.userId = payload.userId
        next()
    } catch (err) {
        res.status(401).json({
            success: false,
            error: "invalid or expired access token"
        })
    }
}