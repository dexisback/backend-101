import { Worker } from "bullmq";
import { RedisConnection } from "bullmq";
import {env} from "../config/env"
import {prisma} from "../db/prisma"
import { runCIPipeline } from "./pipelines/ci.pipeline";
import { log } from "../utils/logger";

export const worker = new Worker(env.QUEUE_NAME, async(job)=>{
    const event = job.data;

    if(event.type!=="github.push"){return}
    //else:
    const { repo, commitId, branch, author } = event.payload
    log(`Processing build for ${repo}, ${commitId}`)
})

