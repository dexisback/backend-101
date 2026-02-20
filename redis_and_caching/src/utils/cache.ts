//global users of cache commands:
import { log } from "console";
import redis from "../config/redis.js";
//get, set, del cache


export async function getCache<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    if(!data) return null
    return JSON.parse(data) as T //because we dont know what will be the data that is being cached, util hai ye

}

export async function setCache(
    key: string,
    value: unknown, //again
    TTL: number
) : Promise<void> {  //returns nothing, just does the job (and maybe a console.log bas)
    await redis.set(key, JSON.stringify(value), {EX: TTL});  //redis.set(key, value, {expirytime})
    console.log("cached value set")
}

export async function deleteCache(key: string): Promise<void>{ //again, returns nothing
    redis.del(key)
}