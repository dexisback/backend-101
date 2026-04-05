import cron from "node-cron"
import { prisma } from "../config/prisma.js"

export const startCron = ()=>{
    
        cron.schedule("0 0 * *", async()=>{
            try {
                const fourtyEightHoursAgo = new Date(Date.now()- (48*60*60*1000))
                //delete all idempotency keys older than that timestamp
                const deleted = await prisma.idempotencyKey.deleteMany({
                    where: {
                        createdAt: {
                            lt: fourtyEightHoursAgo
                        }
                    }
                })
            } catch (err) {
                console.error(err)
            }
        })        
    
}