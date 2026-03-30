import { prisma } from "../../db/prisma.js";
import type { createWebhookInput as CreateWebhookInput } from "./webhook.schema.js";

export async function createWebhook(data: CreateWebhookInput) {
	return prisma.webhook.create({
		data: {
			url: data.url,
			event: data.event,
			secret: data.secret,
		},
	});
}
