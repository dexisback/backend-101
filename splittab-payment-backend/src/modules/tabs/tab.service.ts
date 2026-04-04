import {prisma} from "../../config/prisma.js"

export interface createSplitInput {
    payeeName: string;
    amount: number ;    //we gonna use "paise" as the amount input unit
}



export const createTabWithSplits = async (leaderId: string, totalAmount: number, splits: createSplitInput[])=>{
    //prisma transactions:
    const newTab = await prisma.$transaction(async (transaction)=> {
        const tab = await transaction.tab.create({
            data: {
                leaderId,
                totalAmount,
                status: "PENDING"
            
            }
        })
        
        const splitData = splits.map(split => ({
            tabId: tab.id,
            payeeName: split.payeeName,
            amount: split.amount,
            version: 1
        }))

        //bulk insert the splits:
        await transaction.split.createMany({
            data: splitData
        })

        //return thy tab with its linked splits for sending back to client:
        return transaction.tab.findUnique({
            where: {id: tab.id},
            include: {splits: true}
        })
    })

    return newTab;


}