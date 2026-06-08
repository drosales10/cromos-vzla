import "dotenv/config";
import { sendEmail, isEmailConfigured } from "./services/emailService.js";

const to = process.argv[2] || "admin@dennyrosales.com";

if (!isEmailConfigured()) {
  console.error("Correo no configurado. Revisá MAILTRAP_API_TOKEN y SMTP_FROM en .env");
  process.exit(1);
}

console.log("Enviando prueba a:", to);
console.log("Remitente:", process.env.SMTP_FROM);
console.log("Modo:", process.env.MAILTRAP_API_MODE || "sending");

try {
  const result = await sendEmail({
    to,
    subject: "Prueba — La Bolsa de Cromos",
    text: "Si recibís este mensaje, Mailtrap Sending está funcionando correctamente.",
    html: `
      <div style="font-family:sans-serif;line-height:1.5;color:#111;">
        <p><strong>Prueba de correo</strong> — La Bolsa de Cromos</p>
        <p>Si ves este mensaje, la integración con Mailtrap (<code>album.dennyrosales.com</code>) funciona.</p>
      </div>
    `,
    category: "Integration Test",
  });
  console.log("Resultado:", result);
} catch (err) {
  console.error("Error al enviar:", err.message || err);
  process.exit(1);
}
