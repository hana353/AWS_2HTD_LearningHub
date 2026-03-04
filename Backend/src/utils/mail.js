// src/utils/mail.js
// Gửi mail thường qua SMTP (nodemailer), không dùng service bên ngoài (SES, SendGrid...)

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || "noreply@localhost";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[mail] SMTP_USER/SMTP_PASS chưa cấu hình - email sẽ không gửi thật"
    );
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Gửi email đơn giản qua SMTP
 * @param {string} to - Địa chỉ người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} html - Nội dung HTML (ưu tiên)
 * @param {string} [text] - Nội dung text thuần (fallback)
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendMail(to, subject, html, text) {
  const trans = getTransporter();
  if (!trans) {
    console.log("[mail] Skip send (no SMTP config):", { to, subject });
    return { sent: false, error: "SMTP not configured" };
  }
  try {
    await trans.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]+>/g, "").trim() : undefined),
    });
    console.log("[mail] Sent:", { to, subject });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Error:", err.message);
    return { sent: false, error: err.message };
  }
}

export { getTransporter };
