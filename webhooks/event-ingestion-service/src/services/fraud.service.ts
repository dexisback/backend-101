//fraud rules engine:
import {prisma} from "../lib/prisma.js"

export const runFraudChecks = async (eventId: string, type: string, payload: any) => {
    const alerts : string[] = [];
    //fraud 1: high amount of moneyyy:
    if(payload.amount && payload.amount > 690000) {
        alerts.push("high payment amount, cant be processed via this service")
    }
    //fraud 2: multiple failed events in the last 2 mnis
    if(type=== "payment.failed"){
        const twoMinutesAgo = new Date(Date.now()-2*60*1000);   //curren time - 2 minutes, defines time window
        const count = await prisma.event.count({   //defining count -> count all events in the last 2 minutes
            where:  {type: "payment.failed", createdAt: {gte: twoMinutesAgo}}
        })
        if(count>=3){   //if count .... do this that
            alerts.push("multiple failed payments in a short time, sorry")
        }
    }

    //create alerts:
    for(const reason of alerts){
        await prisma.alert.create({
            data: {
                eventId, 
                reason
            }
        })
    }
}


//TODO: right now, counter counts globally across all users, implement per user counting by where: {path:["user_id"], equals:xyz}
