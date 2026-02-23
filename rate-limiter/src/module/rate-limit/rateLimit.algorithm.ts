//login endpoint  -- fixed window logic 




import redis from "../../db/redis.js";

import type {
    FixedWindowConfig, 
    RateLimitResult
} from "./rateLimit.types.js"
//so the function takes in {algorithm, limit , window} and gives out { allowed, reamining, resetAt }
export async function runFixedWindow(
    key: string,
    config: FixedWindowConfig
) : Promise<RateLimitResult> {
    const { limit, window }= config
    const current = await redis.incr(key)
    
    if(current === 1) {
        await redis.expire(key, window)  //if count ==1 then we create an expiration window (this will be our new window)
    }

    //get TTL for reset calculation:
    const TTL= await redis.ttl(key);
   

    const remaining = Math.max(limit-current, 0);
    return {
        allowed: current <= limit, 
        remaining,
        resetAt: Date.now() + TTL * 1000,
    }
}
