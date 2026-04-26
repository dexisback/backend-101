import {  Worker } from "bullmq";
import {env} from "../config/env"
import {prisma} from "../db/prisma"
import { runCIPipeline } from "./pipelines/ci.pipeline";
import { log } from "../utils/logger";
import { redisConnection } from "../config/redis";
import { eventSchema } from "../validators/event.schema";
export const worker = new Worker(env.QUEUE_NAME, async(job)=>{
       const parsedData = eventSchema.safeParse(job.data);
        if(!parsedData.success){
            log("invalid event payload", parsedData.error);
            return
        }
        const event = parsedData.data;
        const eventId = job.data.eventId;
    

    if(event.type!=="github.push"){return}
    //else:
    const { repo, commitId, branch, author } = event.payload
    log(`Processing build for ${repo}, ${commitId}`)

    //creating a build:
    let build: any;
    try {
        build = await prisma.build.create({
            data: {
                repoName: repo,
                commitId,
                branch,
                author,
                status: "RUNNING",
                logs:[]
            }
        });
    } catch (err: any) {
        if (err.code === "P2002") {
            log(`duplicate build ignored for commit ${commitId}`);
            return;
        }
        throw err;
    }

    try {
        //mark running , before execution:
        
     

        await prisma.build.update({
        where: { id: build.id },
        data: { status: "RUNNING" },
      });


      await runCIPipeline(build.id);

    } catch (err: any) {
        await prisma.build.update({
            where: {id: build.id}, data:{status: "FAILED"}
        })
        log("Build failed", build.id)
    }
},
{
    connection: redisConnection
})

worker.on("completed", (job) => {
    log(`Job completed ${job.id}`);
})

worker.on("failed", async (job, err) => {
    log("Job failed permanently", job?.id, err.message);
    if (!job) { return; }
    await prisma.build.update({
        where: { commitId: job.data.payload?.commitId },
        data: { status: "FAILED" }
    }).catch(() => {});
})
