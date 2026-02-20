//job: everything db related
import {prisma} from "../../config/db.js"

//corrections -- no cache or zod logic, pure db logic only, separate standalone 

//id, username, score, createdAt

export const leaderboardRepository = {

    //find the top leaders in the leaderboard:
    //NOTE: why not pagination? because systems usually "cache top 10, cache top 100 " in redis, to show first x fields quick, remaining could be loading
    //so we need top x fields ka finding logic
    //also pagination would make sense in a full fledged frontend , not rn
    async gettopleaderboardFields(limit: number){
        return await prisma.developer.findMany({
            orderBy: {score: "desc"},
            take: limit
        })
    },


    //create a field in the leaderboard
    async createleaderboardField(username: string, score: number){
        return await prisma.developer.create({ 
            data: {
                username, 
                score
            }
        })
    },

    //find someone from the leaderboard
    async findleaderboardField(id: string){
        return await prisma.developer.findUnique({
            where: {id}
        })         
    },

    //delete someone from the leaderboard
    async deleteleaderboardField(id: string){
        return await prisma.developer.delete({
            where: {id}
            //cascading not needed rn, one model
        })
    },
    

    //update someone from the leaderboard
    async updateleaderboardField(id : string, score: number){
        return await prisma.developer.update({
            where : {id},
            data: { score }
        })
    }

}