import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { sendEmail, isEmailConfigured } from "./emailService.js";

const RESET_TTL_HOURS = Number(process.env.PASSWORD_RESET_TTL_HOURS || 2);

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const getPublicAppUrl = () => {
  const raw = process.env.APP_PUBLIC_URL
    || process.env.BASE_URL
    || process.env.FRONTEND_URL
    || "http://localhost:5173";
  return String(raw).trim().replace(/\/+$/, "");
};

const buildResetEmail = ({ name, resetUrl }) => ({
  subject: "Restablecer contraseña — La Bolsa de Cromos",
  text: [
    `Hola ${name},`,
    "",
    "Recibimos una solicitud para restablecer tu contraseña.",
    `Abrí este enlace (válido ${RESET_TTL_HOURS} h):`,
    resetUrl,
    "",
    "Si no solicitaste este cambio, ignorá este mensaje.",
  ].join("\n"),
  html: `
    <div style="font-family:sans-serif;line-height:1.5;color:#111;">
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>La Bolsa de Cromos</strong>.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#C9A84C;color:#08100a;text-decoration:none;border-radius:8px;font-weight:700;">Restablecer contraseña</a></p>
      <p style="font-size:13px;color:#555;">El enlace vence en ${RESET_TTL_HOURS} horas.</p>
      <p style="font-size:13px;color:#555;">Si no solicitaste este cambio, podés ignorar este correo.</p>
    </div>
  `,
});

export const requestPasswordReset = async (prisma, emailRaw) => {
  const email = String(emailRaw || "").trim().toLowerCase();
  if (!email) {
    throw Object.assign(new Error("Email requerido"), { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, blocked: true, passwordHash: true },
  });

  const genericResponse = {
    message: "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.",
  };

  if (!profile?.passwordHash || profile.blocked) {
    console.info("[password-reset] Sin envío — cuenta inexistente, sin contraseña o bloqueada");
    return genericResponse;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_HOURS * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: { userId: profile.id, usedAt: null },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: profile.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  const resetUrl = `${getPublicAppUrl()}?reset=${token}`;
  const mail = buildResetEmail({ name: profile.name || profile.email, resetUrl });

  try {
    const sent = await sendEmail({
      to: profile.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      category: "Password Reset",
    });

    if (sent.sent) {
      console.info("[password-reset] Correo enviado a", profile.email);
    } else {
      console.error("[password-reset] Correo no enviado:", {
        to: profile.email,
        reason: sent.reason,
        email_configured: isEmailConfigured(),
      });
      if (process.env.NODE_ENV !== "production") {
        console.info("[password-reset] Enlace de desarrollo:", resetUrl);
        return {
          ...genericResponse,
          dev_reset_url: resetUrl,
          dev_note: "Correo no configurado — enlace solo visible en desarrollo",
        };
      }
    }
  } catch (err) {
    console.error("[password-reset] Error al enviar correo:", {
      to: profile.email,
      message: err?.message || String(err),
    });
    throw err;
  }

  return genericResponse;
};

export const resetPasswordWithToken = async (prisma, tokenRaw, passwordRaw) => {
  const token = String(tokenRaw || "").trim();
  const password = String(passwordRaw || "");

  if (!token) throw Object.assign(new Error("Token inválido"), { status: 400 });
  if (password.length < 6) {
    throw Object.assign(new Error("La contraseña debe tener al menos 6 caracteres"), { status: 400 });
  }

  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!row?.user || row.user.blocked) {
    throw Object.assign(new Error("El enlace de recuperación es inválido o expiró"), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
    });
  });

  return { message: "Contraseña actualizada. Ya podés iniciar sesión." };
};

export const getPasswordResetConfig = () => ({
  email_configured: isEmailConfigured(),
  ttl_hours: RESET_TTL_HOURS,
});
