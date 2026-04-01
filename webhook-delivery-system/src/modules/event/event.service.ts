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

    // now find matching subscription:
    const subscription = await prisma.subscription.findMany({
        where: { event: data.type },
    });

    return {
        event,
        subscription,
    };
}

//core business logic for matching event and subscription
