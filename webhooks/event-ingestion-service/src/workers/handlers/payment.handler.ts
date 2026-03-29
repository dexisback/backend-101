import {prisma} from "../../lib/prisma.js"
import { runFraudChecks } from "../../services/fraud.service.js"


export const handlePaymentEvent = async(eventId: string, type: string, payload: any) =>{
    console.log(`Handling payment event: ${type}`)

    //now: run fraud checks:
    await runFraudChecks(eventId, type, payload)
    await prisma.event.update({
        where:  {eventId},
        data: {status: "PROCESSED"}
    })

}