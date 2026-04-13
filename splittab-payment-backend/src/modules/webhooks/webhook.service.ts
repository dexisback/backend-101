import {prisma} from "../../config/prisma.js"
import { redisPublisher } from "../../config/redis.js"


export const paymentProcessor = async (razorPayOrderId: string) => {
    //first, we find the split matching to the incoming razorpay order
    const split = await prisma.split.findUnique({
        where: {razorpayOrderId: razorPayOrderId}

    })

    if(!split){return console.error(`split not found for order id ${razorPayOrderId}`)}
    if (split.status === "PAID") {console.log(`order ${razorPayOrderId} alr marked as PAID!!`); return; }

    //occ update: 
    await prisma.$transaction(async(transaction)=>{
        const result = await transaction.split.updateMany({
            where: {
                id: split.id,
                version: split.version   //basically occ lock            }
            },
            data: {
                status: "PAID",
                version: {increment: 1} //increasing version so any request beyond this fails
            } 
        })

        //if count is 0, another porcess updated it first ⚠️⚠️⚠️⚠️⚠️⚠️⚠️ TODO , self notes
        if(result.count ==0){throw new Error (`concurrency conflict: Split was updated by any other process`)}

        await transaction.auditLog.create({
            data: {
                splitId: split.id,
                eventType: `WEBHOOK_PAYMENT_SUCCESS`,
                previousStatus: split.status,
                newStatus: "PAID"
            }
        })

        const pendingCount = await transaction.split.count({
            where: {
                tabId: split.tabId,
                status: "PENDING"
            }
        });

        if (pendingCount === 0) {
            await transaction.tab.update({
                where: { id: split.tabId },
                data: { status: "SETTLED" }
            });

            await transaction.auditLog.create({
                data: {
                    splitId: split.id,
                    eventType: "TAB_SETTLED",
                    previousStatus: "PENDING",
                    newStatus: "SETTLED"
                }
            });
        }
    })


    //transaction finish, now we fetch split again to get tabId for ws room
    const updatedSplit = await prisma.split.findUnique({
        where: {id: split.id}
    })
    if(updatedSplit){ //if exists, broadcast success event to redis
        redisPublisher.publish("payment_updates", JSON.stringify({
            tabId: updatedSplit.tabId,
            splitId: updatedSplit.id,
            status: "PAID",
            payeeName: updatedSplit.payeeName
        }))
    }
    

    //update: existing webhook logic pushes a message to redis immediateely after the db transaction susccefully marks a split as PAID


}
