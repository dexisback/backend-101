import {prisma} from "../../db/db.js"
import type { createTabInput } from "./tabs.schema.js"
import { Prisma } from "../../generated/prisma/client.js"; //for giving tx an explicit type, using Prisma.TransactionClient 


export const createTab = async (input: createTabInput) =>{
    const { totalAmount, totalMembers }= input;
    const baseAmount = (totalAmount/totalMembers)
    const remainingAmount = (totalAmount % totalMembers)

    const amounts:number[] = [];

    for(let i=0; i<totalMembers ; i++){ //if totalmembers=3, this loops 3 times -> so creates 3 members
        if(i===(totalMembers-1)){
            amounts.push(baseAmount+remainingAmount)
        }
        else{
            amounts.push(baseAmount+remainingAmount)
        }
    }
    //we now have the amounts array, containing  the amount to be distributed
    //transactions:
    return prisma.$transaction(async(tx: Prisma.TransactionClient)=>{  //with tx, all queries inside use same DB transaction. either all in or nothing 
        const tab = await tx.tab.create({data: {totalAmount}})
        const members:any=[];
        for(let i=0;i<amounts.length;i++){
            const amount = amounts[i]!;
            //creating each member:
            const member = await tx.tabMember.create({
                data:{
                    tabId: tab.id,
                    amount
                }
            })
            
            const payment = await tx.payment.create({
                data: {tabMemberId: member.id, razorpayOrderId: `temp_${member.id}`}
            })

        members.push({
            memberId: members.indexOf ,
            amount,
            paymentId: payment.id,
        })
        }

        return {
            tabId: tab.id,
            totalAmount,
            members
        }

    })
}