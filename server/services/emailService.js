import nodemailer from "nodemailer";

const parseFromAddress = (fromRaw) => {
  const raw = String(fromRaw || "").trim();
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  if (raw.includes("@")) return { name: "La Bolsa de Cromos", email: raw };
  return { name: "La Bolsa de Cromos", email: "" };
};

export const isEmailConfigured = () => {
  const from = parseFromAddress(process.env.SMTP_FROM);
  if (!from.email) return false;
  if (process.env.MAILTRAP_API_TOKEN) return true;
  return Boolean(process.env.SMTP_HOST);
};

const sendViaMailtrapApi = async (mail) => {
  const token = process.env.MAILTRAP_API_TOKEN;
  const mode = String(process.env.MAILTRAP_API_MODE || "sending").trim().toLowerCase();
  const baseUrl = mode === "sandbox"
    ? "https://sandbox.api.mailtrap.io/api/send"
    : "https://send.api.mailtrap.io/api/send";

  const from = parseFromAddress(process.env.SMTP_FROM);
  const body = {
    from: { email: from.email, name: from.name },
    to: [{ email: mail.to }],
    subject: mail.subject,
    text: mail.text,
    ...(mail.html ? { html: mail.html } : {}),
  };

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mailtrap API ${res.status}: ${detail || res.statusText}`);
  }

  return { sent: true, provider: "mailtrap_api" };
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
 * @param {{ to: string, subject: string, text: string, html?: string }} mail
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
    return sendViaMailtrapApi(mail);
  }

  return sendViaSmtp(mail);
};
