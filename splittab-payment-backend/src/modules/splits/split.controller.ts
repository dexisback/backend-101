import type { Request, Response } from "express";



import * as splitService from "./split.service.js"

//now splitService.paymentOrderGenerator works  (really couldve just exported the function in itself but gand masti to dekho)


export const paymentLinkCreator = async (req: Request, res: Response)=> {
    try {
        const {splitId} = (req.params)  

        if(typeof splitId !== "string" || splitId.trim() === "") {
            return res.status(400).json({message: "splitId only accepts a string format"}) //narrowing down because it can be undefined or array or empty 
        }
        //else:
        const paymentData = await splitService.paymentOrderGenerator(splitId)

        res.status(200).json({
            message: `payment order generated successfully`,
            data: paymentData
        })





    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "internal server error";
        res.status(500).json({ error: message });
    }
}

