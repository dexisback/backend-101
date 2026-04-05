//this file contains both resend and nodemailer. first HTTPS resend and falllback to SMTP if resend goes down:
//NOTE: resend = primary transporter and ndoemailer = fallback



import { Resend } from "resend";
import nodemailer from "nodemailer"


const resend = new Resend(process.env.RESEND_API_KEY );

const  fallbackTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

export const sendEmailViaProvider= async(to: string, subject: string, html: string)=>{
    const senderKaEmail = process.env.SENDER_KA_EMAIL || "doofenshmirtz@lab.gmail.com"
    try {
        const {data, error} = await resend.emails.send({
            from: senderKaEmail,
            to: to,
            subject: subject,
            html: html
        })

        if(error) throw new Error(error.message);
        return { provider: "resend", providerId: data?.id}
    } catch (err) {
        console.error("Resend failed, falling back to SMTP:", err)
        
        try {
            // Fallback to nodemailer
            const info = await fallbackTransport.sendMail({
                from: senderKaEmail,
                to: to,
                subject: subject,
                html: html
            })
            return { provider: "nodemailer", providerId: info.messageId}
        } catch (fallbackErr) {
            console.error("SMTP fallback also failed:", fallbackErr)
            throw new Error("Both email providers failed")
        }
    }
}
