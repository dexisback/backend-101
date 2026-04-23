//NOTE: THIS FILE STAYS AS A REFERENCE, WE BATCHED OUT TO CRITICAL WORKER AND DEFAULT WORKER, THIS DOES NOT NEED TO BE RUN ANYMORE 


import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { processWebhookDelivery } from "../modules/delivery/webhookDelivery.service.js";
import { WEBHOOK_DEFAULT_QUEUE_NAME } from "../queues/webhook.queue.js";




function parsePositiveInt(value: string | undefined, fallback: number): number {
  if(value===undefined || value.trim() === "") return fallback
  const parsed= Number(value);
  if(!Number.isFinite(parsed) || parsed < 1)return fallback
  return Math.floor(parsed)
}

const workerName = process.env.WORKER_NAME ?? "worker-1"
const workerConcurrency = parsePositiveInt(process.env.WORKER_CONCURRENCY, 5)
console.log(`[worker:${workerName}] starting (queue=${WEBHOOK_DEFAULT_QUEUE_NAME}, concurrency=${workerConcurrency})`)


export const webhookDeliveryWorker = new Worker(
  WEBHOOK_DEFAULT_QUEUE_NAME,
  async (job) => {
    const { eventId, subscriptionId, payload } = job.data;

    // console.log("Processing job:", {
    //   eventId,
    //   subscriptionId,
    //   attempt: job.attemptsMade + 1,
    // });
    console.log(
      `[worker:${workerName}] job active id=${job.id} name=${job.name} attempt=${job.attemptsMade + 1} eventId=${eventId} subscriptionId=${subscriptionId}`
    )

    await processWebhookDelivery({
      eventId,
      subscriptionId,
      payload,
      attempt: job.attemptsMade + 1,
    });
  },

    { 
      connection:{url: env.REDIS_URL},
      concurrency: workerConcurrency
    }
  
);

webhookDeliveryWorker.on("completed", (job) => {
  console.log(`[worker:${workerName}] job completed with job id=${job.id}`);
});

webhookDeliveryWorker.on("failed", (job, err) => {
  console.error(`worker:${workerName}] job failed with job id=${job?.id} atemptsMade=${job?.attemptsMade} error=${err.message}`)
  
}, );



//new Worker(queueName, processorFn, { concurrency })

//now reads WORKER_NAME for logging the worker identity, since multiple worker exists now 
//reads WORKER_CONCURRENCY to control parallel job processing in one process 
//bullmq guarantees that each job is locked by only one worker at a time 
//now if i run 3 worker processed each with concurrency 5, we can o upto 15 jobs in parallel
//Scaling is an operational decision, not a code decision , so concurrency in .env


