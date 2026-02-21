//leaderboardRepository.service.ts:

import { leaderboardRepository } from "./leaderboard.repository.js";
import { getCache, setCache, deleteCache } from "../../utils/cache.js";

const LEADERBOARD_TTL= 60  

export const leaderboardService = {
    async gettopLeaderboard(limit: number){
        const cacheKey = `leaderboard:top:${limit}`

        //cache first
        const cache = await getCache<any[]>(cacheKey)
        if(cache){
            return cache
        }
        //invalidation:
        const data= await leaderboardRepository.gettopleaderboardFields(limit)
        await setCache(cacheKey, data, LEADERBOARD_TTL) //set cache to redis
        return data
    },

    async createdLeaderboard(username: string, score: number){
        const created= await leaderboardRepository.createleaderboardField(username, score);
        await invalidateLeaderboardCache()
        return created
    },

    async updateLeaderboard(id: string, score: number){
        const updated = await leaderboardRepository.updateleaderboardField(id, score);
        await invalidateLeaderboardCache()
        return updated
    },
    async deleteLeaderboard(id: string){
        const deleted= await leaderboardRepository.deleteleaderboardField(id)
        await invalidateLeaderboardCache()
        return deleted

    }


}

async function invalidateLeaderboardCache(){
        await deleteCache("leaderboard:top:10")
        await deleteCache("leaderboard:top:50")
        await deleteCache("leaderboard:top:100")
    }
