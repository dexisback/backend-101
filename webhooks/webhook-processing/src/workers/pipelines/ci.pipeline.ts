//this will simulate CI pipeline steps . "simulate", not a real CI github pipeline for now obviously
import {prisma} from "../../db/prisma"
import type { Request, Response } from "express"

const sleep = (ms: number)=> new Promise<void>((resolve)=>setTimeout(resolve, ms))


export const runCIPipeline = async (buildId: string) =>{
    const logs: string[] = []
    const pushLog = async(message: string)=> {
        logs.push(message)
        
        await prisma.build.update({
            where: {id: buildId},
            data: {logs}
        })
    }
    await pushLog("Cloning Repo....");
    await sleep(1000)

    //------

    await pushLog("Installing dependencies....")
    await sleep(1000)

    //-----

    await pushLog("Running tests....")
    await sleep(1000)

    //-----

    if(Math.random()<0.3){
        await pushLog("Tests Failed! ")
        throw new Error("CI failed")
    }
    //else:

    await pushLog("All tests passed!")
}

