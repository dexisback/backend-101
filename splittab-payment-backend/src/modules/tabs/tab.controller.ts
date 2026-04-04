import type { Request, Response, NextFunction } from "express";
import * as tabService from "./tab.service.js";

export const createTab = async (req: Request, res: Response) => {
    try {
        const{ leaderId, totalAmount, splits }= req.body 
        if (!leaderId || totalAmount == null || !splits || !Array.isArray(splits)) {
            return res.status(400).json({error: "invalid payment"})

        }
        const splitTotal = splits.reduce((sum: number, split: { amount: number }) => sum + split.amount, 0)
        if(splitTotal !== totalAmount) {
            return res.status(400).json({error: "split amount do not match total amount"})

        }
        //call the service layer:
        const newTab = await tabService.createTabWithSplits(leaderId, totalAmount, splits)

        res.status(201).json({
            message: "tab created successfully",
            data: newTab
        })
    } catch (err) {
        console.error(`${err} is the error`)
        res.status(500).json({error: `internal server error buddy`})

    }
}