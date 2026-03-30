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
        //mark running , before execution:
        
     

        await prisma.build.update({
        where: { id: build.id },
        data: { status: "RUNNING" },
      });


      //run pipeline: 
      await runCIPipeline(build.id);
      //success:
      
      await prisma.build.update({
        where: {id: build.id}, data: {status: "SUCCESS"}
      })
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

