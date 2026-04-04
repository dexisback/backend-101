import cron from "node-cron"
import { prisma} from "../../config/prisma.js"
import razorpay from "../../config/razorpay.js"
import { paymentProcessor } from "../webhooks/webhook.service.js"



//we will run it every 15 mins:
export const startReconciliationCron = ()=>{
    cron.schedule('*/15 * * * *', async ()=>{
        console.log(`Runnning payment reconcilliation engine`)

        try {
            //finding splits stuck in PENDING status for more than 15 mins
            const fifteenMinutesAgo = new Date(Date.now() - (15*60*1000))
            const pendingSplits = await prisma.split.findMany({
                where: {
                    status: "PENDING",
                    razorpayOrderId: { not: null },
                    updatedAt : { lt: fifteenMinutesAgo }

                }
            })

            if(pendingSplits.length === 0 ){return};
            //else:
            for (const split of pendingSplits) {
                if (!split.razorpayOrderId) continue;

                const payments = await razorpay.orders.fetchPayments(split.razorpayOrderId);

                //checking if any of the payments linked w this order are captured 
                const isPaid = payments.items.some((payment: any)=>payment.status === "captured")
                if(isPaid){
                    console.log(`reconcilliation cuaght missed webhook for order: ${split.razorpayOrderId}`)
                    await paymentProcessor(split.razorpayOrderId) //reuse our highly secure occ webhook logic 
                }
            }

            
        } catch (err) {
            console.error("reconciliation engine error:", err)
        }
    })
}