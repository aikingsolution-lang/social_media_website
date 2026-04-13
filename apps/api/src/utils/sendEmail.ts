import nodemailer from "nodemailer";

const MAIL_HOST = process.env.MAIL_HOST || "smtp.gmail.com";
const MAIL_PORT = Number(process.env.MAIL_PORT || 587);
const MAIL_SECURE = process.env.MAIL_SECURE === "true";
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM || MAIL_USER;

if (!MAIL_USER || !MAIL_PASS) {
    console.warn("[Mail] MAIL_USER or MAIL_PASS is missing.");
}

const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
    },
});

export async function sendEmail({
    to,
    subject,
    html,
    text,
}: {
    to: string;
    subject: string;
    html: string;
    text?: string;
}) {
    const info = await transporter.sendMail({
        from: MAIL_FROM,
        to,
        subject,
        text,
        html,
    });

    console.log("[Mail] Sent:", info.messageId);
    return info;
}