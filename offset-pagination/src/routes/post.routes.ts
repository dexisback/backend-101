//we define the routes here, since this is a small project, we dont do controllers and router wali harkatr



import { Router } from "express"; //no middleware for now
import type { Request, Response } from "express";
import prisma from "../db/db.js"

import { CreatePostSchema, paginationQuerySchema } from "../schemas/post.schema.js";

export const postRouter= Router();


postRouter.post("/posts", async (req:Request, res:Response)=>{
        const result=CreatePostSchema.safeParse(req.body);
        //so add this check everywhere, and from now on use safeparse with zod schema objects, this is an added advantage of zod now
        if(!result.success){
            res.status(400).json({
                error: "invalid request body",
                details: result.error.format()
            })
            return
        }

        const postData= await prisma.post.create({
            data: result.data
        })
        res.status(200).json(postData); 
})


//get all posts but paginated endpoint (offset pagination)
postRouter.get("/posts", async(req:Request, res:Response)=>{
    //we req.query , not req.body in get, because create me toh body me kuch bhejna padta hai na    
    const allData=paginationQuerySchema.safeParse(req.query)
    if(!allData.success){
        res.status(400).json({
            msg: "in valid query parameter",
            details: allData.error.format()
        })
        return
    }
    //pagination concept:
    const { page, limit } = allData.data


    const skip= (page-1)*limit
    const [posts, total]= await Promise.all([
        prisma.post.findMany({
            skip, 
            take: limit,
            orderBy: {createdAt: "desc"}
        }),
        prisma.post.count()
    ])

    const totalPages=Math.ceil(total/limit);
    res.json({
        data: posts,
        pagination:{total, page, limit, totalPages, hasNext: page<totalPages, hasPrev: page>1}
    })

})


//get a single post endpoint
postRouter.get("/posts/:id", async(req:Request, res:Response)=>{
        const {id}= req.params;
        if(!id || Array.isArray(id) ){ //in express v5, express assumes an id as a string or undefined or an array of a string, so you have to include the array type asw. and is wali if block se what we are doing is , removing the possibility of id being undefined , or an Array(of string), and so narrowing down to the "id can only be string"
            
            res.status(400).json({msg: "missing id parameter"})
            return
        }
        const post=await prisma.post.findUnique({
            where: {id}
        })
        if(!post){
            res.status(404).json({
                msg: "post not found, doesnt exist"
            })
            return
        }
        res.json(post)

})



