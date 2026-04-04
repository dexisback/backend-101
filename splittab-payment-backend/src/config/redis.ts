import {Redis} from "ioredis"
import "dotenv/config"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"


export const redisPublisher = new Redis(redisUrl);
export const redisSubscriber = new Redis(redisUrl);

redisPublisher.on("connect", ()=>console.log("redis publisher connected"))
redisSubscriber.on("connect", ()=>console.log("redis subscriber connected"))




//global redis pub sub instance 
