import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

const email = String(process.env.SUPERUSER_EMAIL || "superadmin@cromos.local").trim().toLowerCase();
const password = String(process.env.SUPERUSER_PASSWORD || "ChangeMe123!").trim();
const name = String(process.env.SUPERUSER_NAME || "Superusuario").trim();
const username = String(process.env.SUPERUSER_USERNAME || "superadmin").trim().toLowerCase();

if (!email || !password || !username) {
  console.error("Missing SUPERUSER_EMAIL, SUPERUSER_PASSWORD or SUPERUSER_USERNAME");
  process.exit(1);
}

if (password.length < 6) {
  console.error("SUPERUSER_PASSWORD must have at least 6 characters");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.profile.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  let user;
  if (existing) {
    user = await prisma.profile.update({
      where: { id: existing.id },
      data: {
        email,
        username,
        name: existing.name || name,
        passwordHash,
        blocked: false,
        isAdmin: true,
        isSuperuser: true,
      },
    });
  } else {
    user = await prisma.profile.create({
      data: {
        id: randomUUID(),
        email,
        username,
        name,
        passwordHash,
        groups: [],
        blocked: false,
        isAdmin: true,
        isSuperuser: true,
      },
    });
  }

  await prisma.userCromos.upsert({
    where: { userId: user.id },
    create: { userId: user.id, have: [], doubles: [], need: [] },
    update: {},
  });

  console.log(`Superuser ready: ${user.email} (${user.username})`);
  console.log("Remember to change SUPERUSER_PASSWORD in .env.local after first use.");
} catch (err) {
  console.error("Failed to create/update superuser", err?.message || err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
