import "./loadEnv.js";
import { PrismaClient } from "@prisma/client";

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Uso: node server/check-user-email.js <email>");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const profile = await prisma.profile.findUnique({
    where: { email },
    select: { email: true, name: true, blocked: true, passwordHash: true },
  });

  if (!profile) {
    console.log({ found: false, email });
  } else {
    console.log({
      found: true,
      email: profile.email,
      name: profile.name,
      blocked: profile.blocked,
      hasPassword: Boolean(profile.passwordHash),
      canReset: Boolean(profile.passwordHash) && !profile.blocked,
    });
  }
} finally {
  await prisma.$disconnect();
}
