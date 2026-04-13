import type { Request, Response, NextFunction } from "express";
import * as tabService from "./tab.service.js";
import { z } from "zod";

const createTabSchema = z.object({
    leaderId: z.string().min(1),
    totalAmount: z.number().int().positive(),
    splits: z.array(
        z.object({
            payeeName: z.string().min(1),
            amount: z.number().int().positive()
        })
    ).min(1)
});

export const createTab = async (req: Request, res: Response) => {
    try {
        const { leaderId, totalAmount, splits } = createTabSchema.parse(req.body);
        const splitTotal = splits.reduce((sum, split) => sum + split.amount, 0)
        if (splitTotal !== totalAmount) {
            return res.status(400).json({error: "split amount do not match total amount"})
        }

        const newTab = await tabService.createTabWithSplits(leaderId, totalAmount, splits)

        return res.status(201).json({
            message: "tab created successfully",
            data: newTab
        })
    } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                error: "validation failed",
                details: err.issues
            });
        }
        console.error(`${err} is the error`)
        return res.status(500).json({error: `internal server error buddy`})
    }
}
