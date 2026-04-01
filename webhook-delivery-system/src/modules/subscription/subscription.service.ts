import { prisma } from "../../db/prisma.js";
import type { createSubscriptionInput as createSubscriptionInput } from "./subscription.schema.js";

export async function createSubscription(data:createSubscriptionInput ) {
	return prisma.subscription.create({
		data: {
			url: data.url,
			event: data.event,
			secret: data.secret,
		},
	});
}
