import { prisma } from "../lib/prisma.js";

export const createEvent = async (eventId: string, provider: string, type: string, payload: any) => {
  return await prisma.event.create({
    data: {
      eventId,
      provider,
      type,
      payload,
      status: "PENDING"
    }
  });
};

export const getEventById = async (eventId: string) => {
  return await prisma.event.findUnique({
    where: { eventId },
    include: { alerts: true }
  });
};

export const updateEventStatus = async (eventId: string, status: "PENDING" | "PROCESSED" | "FAILED") => {
  return await prisma.event.update({
    where: { eventId },
    data: { status }
  });
};

export const listEvents = async (provider?: string, limit: number = 100) => {
  return await prisma.event.findMany({
    where: provider ? { provider } : undefined,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { alerts: true }
  });
};
