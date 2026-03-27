import type { Request, Response } from "express";
import { createTabSchema } from "./tabs.schema.js";
import * as tabService from "./tabs.service.js"


export const createTab = async (req: Request, res: Response) =>{
    const validatedInfo = createTabSchema.safeParse(req.body);
    if(!validatedInfo.success){
        return res.status(400).json({message: "bad input"})
    }
    //else:
    const result = await tabService.createTab(validatedInfo.data)
}