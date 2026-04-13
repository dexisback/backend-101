import type { Request, Response, NextFunction } from "express";
const trustedIps = new Set(
    (process.env.RAZORPAY_WEBHOOK_IPS || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
)


export const ipWhitelistMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if(trustedIps.size === 0) {return next()};

    let source = "";
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        const firstIp = forwardedFor.split(",")[0];
        source = firstIp ? firstIp.trim() : "";
    } else if (req.socket.remoteAddress) {
        source = req.socket.remoteAddress;
    }

    if(!trustedIps.has(source)){
        return res.status(403).json({error: "Forbidden IP"})
    }
    next();
}
