import { prisma } from "../lib/prisma.js";

/**
 * Check if an event with the given eventId already exists
 * Used for idempotency - prevents duplicate webhook processing
 */
export const checkDuplicate = async (eventId: string): Promise<boolean> => {
  const existing = await prisma.event.findUnique({
    where: { eventId },
    select: { id: true }
  });
  return !!existing;
};

/**
 * Get event by ID for idempotency replay
 */
export const getDuplicateEvent = async (eventId: string) => {
  return await prisma.event.findUnique({
    where: { eventId }
  });
};
