import nodemailer from "nodemailer";

export const isEmailConfigured = () => (
  Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)
);

const createTransporter = () => {
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

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} mail
 */
export const sendEmail = async (mail) => {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP no configurado — mensaje no enviado:", {
      to: mail.to,
      subject: mail.subject,
    });
    return { sent: false, reason: "smtp_not_configured" };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html || undefined,
  });

  return { sent: true };
};
