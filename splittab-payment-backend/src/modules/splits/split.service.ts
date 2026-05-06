import {prisma} from "../../config/prisma.js"
import razorpay from "../../config/razorpay.js"
import crypto from "node:crypto";

export const paymentOrderGenerator = async (splitId: string) => {
    const split = await prisma.split.findUnique({
        where: {id: splitId}
    })

    if(!split) {
        throw new Error("split not found")
    }
    if (split.status === "PAID") {
        throw new Error("split already paid")
    }

    if(split.razorpayOrderId){
        return {
            split,
            orderId: split.razorpayOrderId,
            amount: split.amount,
            currency: "INR",
            reused: true
        }
    }

    const options = {     //define order parameters for razorpay:

        amount: split.amount,
        currency: "INR",
        // Razorpay requires receipt length <= 40 characters.
        // Use a deterministic short hash tied to the split id.
        receipt: `rcpt_${crypto.createHash("sha1").update(split.id).digest("hex").slice(0, 35)}`
    }

    //now calling razorpay API to create the order;
    let order;
    try {
        order = await razorpay.orders.create(options);
    } catch (err: unknown) {
        const anyErr = err as any;
        const description = anyErr?.error?.description ?? anyErr?.message;
        throw new Error(
            description
                ? `Razorpay order create failed: ${description}`
                : "Razorpay order create failed"
        );
    }

    // best-effort idempotency under race: only first write from null->id wins
    const updateResult = await prisma.split.updateMany({
        where: {id: splitId, razorpayOrderId: null, status: "PENDING"},
        data: {
            razorpayOrderId: order.id
        }
    });

    if (updateResult.count === 0) {
        const latestSplit = await prisma.split.findUnique({ where: { id: splitId } });
        if (!latestSplit || !latestSplit.razorpayOrderId) {
            throw new Error("order id save failed");
        }
        return {
            split: latestSplit,
            orderId: latestSplit.razorpayOrderId,
            amount: latestSplit.amount,
            currency: "INR",
            reused: true
        }
    }

    const updatedSplit = await prisma.split.findUnique({ where: { id: splitId } });
    if (!updatedSplit) {
        throw new Error("split not found");
    }

    return {
        split: updatedSplit,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        reused: false
    }
} 

















//high level overview: we verify the split exists and isnt already paid
// then we ask razorpay to create an order.
//finally, we will map that razorpayOrderId back to our Split record in the db
