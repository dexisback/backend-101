import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { processWebhookDelivery } from "../modules/delivery/webhookDelivery.service.js";
import { WEBHOOK_DEFAULT_QUEUE_NAME } from "../queues/webhook.queue.js";

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

const workerName = process.env.WORKER_NAME?.trim() || "default-1";
const workerConcurrency = parsePositiveInt(process.env.WORKER_CONCURRENCY, 5);

console.log(
  `[worker:${workerName}] starting (queue=${WEBHOOK_DEFAULT_QUEUE_NAME}, concurrency=${workerConcurrency})`
);

export const webhookDefaultWorker = new Worker(
  WEBHOOK_DEFAULT_QUEUE_NAME,
  async (job) => {
    const { eventId, subscriptionId, payload } = job.data;

    console.log(
      `[worker:${workerName}] job active id=${job.id} attempt=${
        job.attemptsMade + 1
      } eventId=${eventId} subscriptionId=${subscriptionId}`
    );

    await processWebhookDelivery({
      eventId,
      subscriptionId,
      payload,
      attempt: job.attemptsMade + 1,
    });
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: workerConcurrency,
  }
);

webhookDefaultWorker.on("completed", (job) => {
  console.log(`[worker:${workerName}] job completed id=${job.id}`);
});

webhookDefaultWorker.on("failed", (job, err) => {
  console.error(
    `[worker:${workerName}] job failed id=${job?.id} attemptsMade=${job?.attemptsMade} error=${err.message}`
  );
});