import "./loadEnv.js";
import { isEmailConfigured } from "./services/emailService.js";
import { getPasswordResetConfig } from "./services/passwordResetService.js";

const from = process.env.SMTP_FROM || "(vacío)";
const token = process.env.MAILTRAP_API_TOKEN ? "configurado" : "falta";
const cwd = process.cwd();

console.log("cwd:", cwd);
console.log("SMTP_FROM:", from);
console.log("MAILTRAP_API_TOKEN:", token);
console.log("MAILTRAP_API_MODE:", process.env.MAILTRAP_API_MODE || "sending");
console.log("APP_PUBLIC_URL:", process.env.APP_PUBLIC_URL || "(vacío)");
console.log("BASE_URL:", process.env.BASE_URL || "(vacío)");
console.log("isEmailConfigured:", isEmailConfigured());
console.log("password-reset:", getPasswordResetConfig());
