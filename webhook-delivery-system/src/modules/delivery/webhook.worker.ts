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

    // TODO:
    // fetch event + subscription from DB
    // send webhook
    // log result
  },
  {
    connection: {
      url: env.REDIS_URL!,
    },
  }
);

