import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").optional(),
  DATABASE_URL_POOLED: z.string().min(1).optional(),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL").optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_API_SECRET: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDER_KA_EMAIL: z.string().email().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

const stripWrappingQuotes = (value?: string) => {
  if (!value) return value;
  const trimmed = value.trim();
  const singleQuoted = /^'(.*)'$/.exec(trimmed);
  if (singleQuoted) return singleQuoted[1];
  const doubleQuoted = /^"(.*)"$/.exec(trimmed);
  if (doubleQuoted) return doubleQuoted[1];
  return trimmed;
};

const hasValue = (value?: string) => Boolean(value && value.length > 0);

const DATABASE_URL = stripWrappingQuotes(parsed.data.DATABASE_URL);
const DATABASE_URL_POOLED = stripWrappingQuotes(parsed.data.DATABASE_URL_POOLED);
const RESEND_API_KEY = stripWrappingQuotes(parsed.data.RESEND_API_KEY);
const RESEND_API_SECRET = stripWrappingQuotes(parsed.data.RESEND_API_SECRET);
const RESEND_FROM_EMAIL = stripWrappingQuotes(parsed.data.RESEND_FROM_EMAIL);
const RESEND_WEBHOOK_SECRET = stripWrappingQuotes(parsed.data.RESEND_WEBHOOK_SECRET);
const REDIS_URL = stripWrappingQuotes(parsed.data.REDIS_URL);
const SMTP_HOST = stripWrappingQuotes(parsed.data.SMTP_HOST);
const SMTP_PORT = stripWrappingQuotes(parsed.data.SMTP_PORT);
const SMTP_USER = stripWrappingQuotes(parsed.data.SMTP_USER);
const SMTP_PASS = stripWrappingQuotes(parsed.data.SMTP_PASS);
const SENDER_KA_EMAIL = stripWrappingQuotes(parsed.data.SENDER_KA_EMAIL) ?? RESEND_FROM_EMAIL;

if (!hasValue(DATABASE_URL) && !hasValue(DATABASE_URL_POOLED)) {
  throw new Error("Invalid environment configuration: DATABASE_URL or DATABASE_URL_POOLED is required");
}

const resolvedResendKey = RESEND_API_KEY ?? RESEND_API_SECRET;
const hasSmtpCredentials = hasValue(SMTP_HOST) && hasValue(SMTP_PORT) && hasValue(SMTP_USER) && hasValue(SMTP_PASS);
if (!hasValue(resolvedResendKey) && !hasSmtpCredentials) {
  throw new Error(
    "Invalid environment configuration: configure RESEND_API_KEY/RESEND_API_SECRET or complete SMTP credentials"
  );
}

export const env = {
  ...parsed.data,
  DATABASE_URL,
  DATABASE_URL_POOLED,
  REDIS_URL,
  RESEND_API_KEY: resolvedResendKey,
  RESEND_WEBHOOK_SECRET,
  RESEND_FROM_EMAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SENDER_KA_EMAIL,
};
