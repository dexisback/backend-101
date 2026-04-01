import { Worker } from "bullmq";
import { env } from "../../config/env.js";


export const webhookDeliveryWorker = new Worker(
  "delivery-queue",
  async (job) => {
    const { eventId, subscriptionId, payload } = job.data;

    console.log("Processing job:", {
      eventId,
      subscriptionId,
    });

   
  },
  {
    connection: {
      url: env.REDIS_URL!,
    },
  }
);



webhookDeliveryWorker.on("completed", (job)=>{
  console.log(`Job completed: ${job}`)
})


webhookDeliveryWorker.on("failed", (job, err)=>{
  console.error(`Job failed: ${job?.id}`, err.message)
})
