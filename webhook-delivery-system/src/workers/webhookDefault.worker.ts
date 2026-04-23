import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { processWebhookDelivery } from "../modules/delivery/webhookDelivery.service.js";
import { WEBHOOK_DEFAULT_QUEUE_NAME, webhookDlqQueue } from "../queues/webhook.queue.js";

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
    limiter: { max: env.DEFAULT_LANE_RPS, duration: 1000 },
  }
);

webhookDefaultWorker.on("completed", (job) => {
  console.log(`[worker:${workerName}] job completed id=${job.id}`);
});

webhookDefaultWorker.on("failed", async (job, err) => {
  console.error(
    `[worker:${workerName}] job failed id=${job?.id} attemptsMade=${job?.attemptsMade} error=${err.message}`
  );

  if (!job) return;

  const maxAttempts = job.opts.attempts ?? 1;
  const isFinal = job.attemptsMade >= maxAttempts;
  if (isFinal) {
    await webhookDlqQueue.add(
      "dead-letter",
      {
        originalQueue: "default",
        originalJobId: job.id ?? null,
        name: job.name,
        attemptsMade: job.attemptsMade,
        maxAttempts,
        eventId: job.data.eventId,
        subscriptionId: job.data.subscriptionId,
        payload: job.data.payload,
        failedAt: new Date().toISOString(),
        errorMessage: err.message,
      },
      { removeOnComplete: { count: env.DLQ_REMOVE_ON_COMPLETE_COUNT } }
    );
  }


});