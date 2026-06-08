import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

const parseFromAddress = (fromRaw) => {
  const raw = String(fromRaw || "").trim();
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  if (raw.includes("@")) return { name: "La Bolsa de Cromos", email: raw };
  return { name: "La Bolsa de Cromos", email: "" };
};

export const getMailtrapMode = () => {
  const mode = String(process.env.MAILTRAP_API_MODE || "sending").trim().toLowerCase();
  return {
    mode,
    sandbox: mode === "sandbox",
    testInboxId: process.env.MAILTRAP_INBOX_ID || null,
  };
};

export const isEmailConfigured = () => {
  const from = parseFromAddress(process.env.SMTP_FROM);
  if (!from.email) return false;
  if (process.env.MAILTRAP_API_TOKEN) return true;
  return Boolean(process.env.SMTP_HOST);
};

const createMailtrapTransporter = () => {
  const { sandbox: isSandbox } = getMailtrapMode();
  const inboxIdRaw = process.env.MAILTRAP_INBOX_ID;
  const testInboxId = inboxIdRaw ? Number(inboxIdRaw) : undefined;

  return nodemailer.createTransport(
    MailtrapTransport({
      token: process.env.MAILTRAP_API_TOKEN,
      sandbox: isSandbox,
      ...(isSandbox && testInboxId ? { testInboxId } : {}),
    }),
  );
};

const sendViaMailtrap = async (mail) => {
  const transporter = createMailtrapTransporter();
  const from = parseFromAddress(process.env.SMTP_FROM);

  await transporter.sendMail({
    from: { address: from.email, name: from.name },
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html || undefined,
    category: mail.category || "Transactional",
  });

  return { sent: true, provider: "mailtrap" };
};

const createSmtpTransporter = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  });
};

const sendViaSmtp = async (mail) => {
  const transporter = createSmtpTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html || undefined,
  });
  return { sent: true, provider: "smtp" };
};

/**
 * @param {{ to: string, subject: string, text: string, html?: string, category?: string }} mail
 */
export const sendEmail = async (mail) => {
  if (!isEmailConfigured()) {
    console.warn("[email] Correo no configurado — mensaje no enviado:", {
      to: mail.to,
      subject: mail.subject,
    });
    return { sent: false, reason: "email_not_configured" };
  }

  if (process.env.MAILTRAP_API_TOKEN) {
    return sendViaMailtrap(mail);
  }

  return sendViaSmtp(mail);
};
