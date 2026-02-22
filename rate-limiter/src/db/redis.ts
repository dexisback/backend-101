import { createClient } from "redis";
import { env } from "../config/env.js";


//this env contains REDIS_URL validated w zod
const redis = createClient({
    url: env.REDIS_URL
})


redis.on("error", (err)=>{
    console.error("Redis error", err)
})

await redis.connect();
export default redis;

