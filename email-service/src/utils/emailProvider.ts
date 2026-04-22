//Email sending with provider fallback: Resend (primary) -> SMTP (fallback)

import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logError, logInfo, logWarn } from "./logger.js";

const hasValidResendKey = env.RESEND_API_KEY?.startsWith("re_");
const resend = hasValidResendKey ? new Resend(env.RESEND_API_KEY) : null;

const hasSmtpConfig = env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS;
const fallbackTransport = hasSmtpConfig
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT || "587", 10),
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
        }
    })
    : null;

export const sendEmailViaProvider = async (to: string, subject: string, html: string) => {
    const sender = env.SENDER_KA_EMAIL || "onboarding@resend.dev";

    if (resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: sender,
                to,
                subject,
                html
            });

            if (error) {
                throw new Error(error.message);
            }
            return { provider: "resend", providerId: data?.id };
        } catch (err) {
            logWarn("Resend failed, falling back to SMTP", { error: String(err) });
        }
    } else {
        logInfo("Resend disabled; using SMTP transport", { reason: "missing_or_invalid_resend_api_key" });
    }

    if (!fallbackTransport) {
        throw new Error("No fallback SMTP configuration available");
    }

    try {
        const info = await fallbackTransport.sendMail({
            from: sender,
            to,
            subject,
            html
        });
        return { provider: "nodemailer", providerId: info.messageId };
    } catch (fallbackErr) {
        logError("SMTP fallback also failed", { error: String(fallbackErr) });
        throw new Error("Both email providers failed");
    }
};
