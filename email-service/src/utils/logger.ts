type Meta = Record<string, unknown>;

const format = (level: "info" | "warn" | "error", message: string, meta?: Meta) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  });
};

export const logInfo = (message: string, meta?: Meta) => {
  console.log(format("info", message, meta));
};

export const logWarn = (message: string, meta?: Meta) => {
  console.warn(format("warn", message, meta));
};

export const logError = (message: string, meta?: Meta) => {
  console.error(format("error", message, meta));
};
