
//controller, parses query using leaderboardSchema 
//calls leaderboardserive.getTopLeaderboard(limit)
//return ApiResponse.success()

import { QuerySchema } from "./leaderboard.schema.js";
import type {Request, Response} from "express";
import ApiResponse from "../../utils/apiResponse.js"
import { leaderboardService } from "./leaderboard.service.js";

export const leaderboardController = {
    //get all, 
    //GET: /leaderboard/
    async top(req: Request, res: Response){        
        //else:
        const data= QuerySchema.safeParse(req.query);
        if(!data.success){
            res.status(400).json(ApiResponse.error("bad request", 400))
            return
        }
        const {limit}=data.data; //fix: earlier : const limit= data.data gave { limit } as the variable, harder type narrowing
        //could also do : const limit=data.data.limit
        
        //limit needs to be narrowed down: NO, narrowing down becomes useless because safeParse ensures already that limit is a number 
        
        const leaderboardData=await leaderboardService.gettopLeaderboard(limit)
        return res.json(ApiResponse.success(leaderboardData))
    }
}

