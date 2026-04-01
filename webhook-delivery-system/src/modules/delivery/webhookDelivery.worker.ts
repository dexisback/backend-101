import { Worker } from "bullmq";
import { env } from "../../config/env.js";
import { processWebhookDelivery } from "../../modules/delivery/webhookDelivery.service.js";

export const webhookDeliveryWorker = new Worker(
  "webhook-delivery-queue",
  async (job) => {
    const { eventId, subscriptionId, payload } = job.data;

    console.log("Processing job:", {
      eventId,
      subscriptionId,
      attempt: job.attemptsMade + 1,
    });

    await processWebhookDelivery({
      eventId,
      subscriptionId,
      payload,
      attempt: job.attemptsMade + 1,
    });
  },
  {
    connection: {
      url: env.REDIS_URL!,
    },
  }
);

webhookDeliveryWorker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

webhookDeliveryWorker.on("failed", (job, err) => {
  console.error(`Job failed: ${job?.id}`, err.message);
});