//login endpoint  -- fixed window logic 




import redis from "../../db/redis.js";

import type {
    FixedWindowConfig, 
    RateLimitResult
} from "./rateLimit.types.js"

//takes in a key and config (here fixed window, we build other for bucket ) , returns a result from the process (a promise)
export async function runFixedWindow(
    key: string,
    config: FixedWindowConfig
) : Promise<RateLimitResult> {
    const { limit, window }= config
    //increment counter:
    const current = await redis.incr(key)
    //current starts from 1, and right now , if pehli cheez aayi toh uska count would be 1
    //if first request is IN the window  -> set its expirt
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
