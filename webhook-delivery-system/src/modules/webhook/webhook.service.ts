import {prisma} from "../../db/prisma.js"
import type { createWebhookInput } from "./webhook.schema.js"

export async function createWebhook(data: createWebhookInput){
    return prisma.webhook.create({data})
}
