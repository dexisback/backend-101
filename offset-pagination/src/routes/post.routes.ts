



import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db/db.js"

import { CreatePostSchema, paginationQuerySchema } from "../schemas/post.schema.js";

export const postRouter = Router();


postRouter.post("/posts", async (req: Request, res: Response) => {
    const result = CreatePostSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({
            error: "invalid request body",
            details: result.error.format()
        })
        return
    }

    const postData = await prisma.post.create({
        data: result.data
    })
    res.status(200).json(postData);
})



postRouter.get("/posts", async (req: Request, res: Response) => {

    const allData = paginationQuerySchema.safeParse(req.query)
    if (!allData.success) {
        res.status(400).json({
            msg: "in valid query parameter",
            details: allData.error.format()
        })
        return
    }

    const { page, limit } = allData.data


    const skip = (page - 1) * limit
    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" }
        }),
        prisma.post.count()
    ])

    const totalPages = Math.ceil(total / limit);
    res.json({
        data: posts,
        pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
    })

})



postRouter.get("/posts/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || Array.isArray(id)) {

        res.status(400).json({ msg: "missing id parameter" })
        return
    }
    const post = await prisma.post.findUnique({
        where: { id }
    })
    if (!post) {
        res.status(404).json({
            msg: "post not found, doesnt exist"
        })
        return
    }
    res.json(post)

})



