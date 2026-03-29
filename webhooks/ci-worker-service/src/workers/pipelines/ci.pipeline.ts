//this will simulate CI pipeline steps . "simulate", not a real CI github pipeline for now obviously
import {prisma} from "../../db/prisma"
import type { Request, Response } from "express"

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const runCIPipeline 
