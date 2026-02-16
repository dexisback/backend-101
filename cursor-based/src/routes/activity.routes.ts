import type { Request, Response, NextFunction } from "express";
import { createActivitySchema, cursorQuerySchema } from "../schemas/activity.schema.js";
import prisma from "../db/prisma.js";
import { Router } from "express";
import { idSchema } from "../schemas/activity.schema.js";
export const activityRouter = Router()

//post an activity
activityRouter.post("/activities", async(req:Request, res:Response)=>{
    const result= createActivitySchema.safeParse(req.body)
    if(!result.success){
        res.status(400).json({
            error: "invalid request body",
            details: result.error.format()
        })
        return
    }
    //result contains data and status
    const activity=await prisma.activity.create({
        data: result.data
    })
    res.status(201).json(activity)
})


//get all activities:
activityRouter.get("/activities", async(req:Request, res:Response)=>{
    const result=cursorQuerySchema.safeParse(req.query);
    if(!result.success){
        res.status(400).json({
            error: "invalid query schema",
            details: result.error.format()
        })
        return
    }

    const { limit, cursor } = result.data;
    
    let activities;
    if (cursor) {
        activities = await prisma.activity.findMany({
            take: limit + 1,
            cursor: { id: cursor },
            skip: 1,
            orderBy: { createdAt: "desc" }
        });
    } else {
        activities = await prisma.activity.findMany({
            take: limit + 1,
            skip: 0,
            orderBy: { createdAt: "desc" }
        });
    }
    res.json(activities)
})


//get an activity by id
activityRouter.get("/activities/:id", async (req: Request, res: Response) => {
  const idData= idSchema.safeParse(req.params)
  if(!idData.success){
    res.status(400).json({msg: "bad id"})
    return
  }
  const id=idData.data.id;

  const activity = await prisma.activity.findUnique({
    where: { id }
  });

  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }

  res.json(activity);
});