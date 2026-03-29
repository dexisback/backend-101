export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${message}`, meta || "");
  },

  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta || "");
  },
};