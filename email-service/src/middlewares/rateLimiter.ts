import type { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis.js";



const maxRequest= 10
const windowSeconds =1 
//so, 10 request per 1 second max allowed

const tenantRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    if(!tenantId) { return res.status(400).json({
        success: false,
        message: "Missing x-tenant-id header"
    })
}

const redisKey = `rate_limit:${tenantId}`
const requestCount = await redisClient.incr(redisKey)

if(requestCount === 1){
    await redisClient.expire(redisKey, windowSeconds);    
}

if(requestCount> maxRequest){
    return res.status(429).json({
        success: false,
        message: "too many requests, try again later"
    })    
}
    next();
}

export default tenantRateLimiter;