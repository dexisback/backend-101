import { prisma } from "../../db/prisma.js";
import type { emitEventInput } from "./event.schema.js";

export async function emitEvent(data: emitEventInput) {
    // first, store event:
    const event = await prisma.event.create({
        data: {
            type: data.type,
            payload: data.payload,
        },
    });

    // now find matching webhooks:
    const webhooks = await prisma.webhook.findMany({
        where: { event: data.type },
    });

    return {
        event,
        webhooks,
    };
}