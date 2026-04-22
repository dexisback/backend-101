import { logWarn } from "./logger.js";

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  operationName?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientPrismaConnectivityError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const anyError = error as Error & { code?: string };
  const code = anyError.code;
  return code === "ETIMEDOUT" || code === "P1001";
};

export const withPrismaRetry = async <T>(task: () => Promise<T>, options?: RetryOptions): Promise<T> => {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 150;
  const operationName = options?.operationName ?? "prisma_operation";

  let attempt = 0;
  while (true) {
    try {
      return await task();
    } catch (error) {
      if (!isTransientPrismaConnectivityError(error) || attempt >= retries) {
        throw error;
      }

      const waitMs = baseDelayMs * Math.pow(2, attempt);
      logWarn("Transient Prisma connectivity error, retrying", {
        operationName,
        attempt: attempt + 1,
        retries,
        waitMs,
        error: String(error),
      });
      await sleep(waitMs);
      attempt += 1;
    }
  }
};
