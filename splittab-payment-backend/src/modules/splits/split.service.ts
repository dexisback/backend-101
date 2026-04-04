import {prisma} from "../../config/prisma.js"
import razorpay from "../../config/razorpay.js"

export const paymentOrderGenerator = async (splitId: string) => {
    const split = await prisma.split.findUnique({
        where: {id: splitId}
    })

    if(!split) {
        throw new Error("split not found")
    }
    const options = {     //define order parameters for razorpay:

        amount: split.amount,
        currency: "INR",
        receipt: `receipt_${split.id}`   //custom receipt id linking to our db
    }

    //now calling razorpay API to create the order;
    const order = await razorpay.orders.create(options);
    
    const updatedSplit = await prisma.split.update({ //saving razorpay order id to our split record
        where: {id: splitId},
        data: {
            razorpayOrderId: order.id
        }
    });

    return {
        split: updatedSplit,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
    }
} 

















//high level overview: we verify the split exists and isnt already paid
// then we ask razorpay to create an order.
//finally, we will map that razorpayOrderId back to our Split record in the db
