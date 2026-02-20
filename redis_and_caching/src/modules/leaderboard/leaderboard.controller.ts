
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
        //validate query:
        const result=QuerySchema.safeParse(req.query)
        if(!result.success){
            res.status(400).json({msg: "sike "})
            return
        }
        //else:
        const limit= result.data?.limit

        //need to narrow limit to only number
        if(typeof limit==="undefined"){
                res.status(400).json({msg: "sike "})
                return
            
        }
        //call service:
        const leaderboardData=await leaderboardService.gettopLeaderboard(limit)
        return res.json({msg: leaderboardData})
    }
}

