import { tryCatch, Worker } from "bullmq";
import { RedisConnection } from "bullmq";
import {env} from "../config/env"
import {prisma} from "../db/prisma"
import { runCIPipeline } from "./pipelines/ci.pipeline";
import { log } from "../utils/logger";
import { redisConnection } from "../config/redis";

export const worker = new Worker(env.QUEUE_NAME, async(job)=>{
    const event = job.data;

    if(event.type!=="github.push"){return}
    //else:
    const { repo, commitId, branch, author } = event.payload
    log(`Processing build for ${repo}, ${commitId}`)

    //creating a build:
    const build = await prisma.build.create({
        data: {
            repoName: repo,
            commitId,
            branch,
            author,
            status: "RUNNING",
            logs:[]
        }
    })

    try {
        await runCIPipeline(build.id)

        await prisma.build.update({
        where: { id: build.id },
        data: { status: "SUCCESS" },
      });

      log("Bulid success", build.id)


    } catch (err) {
        await prisma.build.update({
            where: {id: build.id}, data:{status: "FAILED"}
        })
        log("Build failed", build.id)
    }
},
{
    connection: redisConnection
})

