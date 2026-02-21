
//controller, parses query using leaderboardSchema 
//calls leaderboardserive.getTopLeaderboard(limit)
//return ApiResponse.success()

import { CreateSchema, IdParamSchema, QuerySchema, UpdateSchema } from "./leaderboard.schema.js";
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
    },



    async create(req: Request, res: Response){
        const createData= CreateSchema.safeParse(req.body);
        if(!createData.success){
            res.status(400).json(ApiResponse.error("bad create request", 400))
            return
        }
        //else:
        const { username, score }=createData.data;
        //repository me createleaderboardField, and service me createdLeaderboard
        //only need to service, service will handle controller:
        const result= await leaderboardService.createdLeaderboard(username, score)
        return res.status(201).json(ApiResponse.success(result))
    },

    async update(req: Request, res: Response){
        const data= UpdateSchema.safeParse(req.body);
        if(!data.success){
            res.status(400).json(ApiResponse.error("bad update request", 400))
            return
        }
        //else:
        //get id from params, and score from body:
        const { id } = IdParamSchema.parse(req.params);
        const { score } = data.data;

        const result= await leaderboardService.updateLeaderboard(id, score)
        return res.status(200).json(ApiResponse.success(result))


    },

    async delete(req: Request, res: Response){
        const { id } = IdParamSchema.parse(req.params);
        const result = await leaderboardService.deleteLeaderboard(id);
        return res.status(200).json(ApiResponse.success(result))
    }

}

