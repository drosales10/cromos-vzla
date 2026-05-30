import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { ALL_CROMOS } from "../src/albumData.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
};

const imagesDir = path.resolve(option("--imagesDir", "img"));
const publicPrefix = option("--publicPrefix", "/img").replace(/\\+$/g, "");
const dryRun = flag("--dry-run");

const normalizeId = (value) => String(value || "")
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, "");

const getRarityBySticker = (sticker) => {
  const n = Number(sticker.num);
  if (sticker.section === "FWC" || sticker.section === "CC") {
    if (n % 10 === 0 || (sticker.section === "CC" && n % 7 === 0)) return "GOLD";
    return "SPECIAL";
  }
  if (n % 20 === 0) return "GOLD";
  return "COMMON";
};

const weightByRarity = (rarity) => {
  if (rarity === "GOLD") return 8;
  if (rarity === "SPECIAL") return 35;
  return 100;
};

const buildImageMap = async (dir) => {
  const out = new Map();
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const base = path.parse(entry.name).name;
    const key = normalizeId(base);
    if (!key) continue;

    // --- NUEVA LÓGICA: Leer archivo y convertir a Base64 ---
    const filePath = path.join(dir, entry.name);
    const fileBuffer = await fs.readFile(filePath);
    const base64Image = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;

    if (!out.has(key)) out.set(key, base64Image);
  }
  return out;
};

const run = async () => {
  let imageMap;
  try {
    imageMap = await buildImageMap(imagesDir);
  } catch (err) {
    if (err && err.code === "ENOENT") {
      throw new Error(`No se encontro la carpeta de imagenes: ${imagesDir}. Usa --imagesDir para indicar otra ruta.`);
    }
    throw err;
  }

  const payload = ALL_CROMOS.map((sticker) => {
    const rarity = getRarityBySticker(sticker);
    const imagePath = imageMap.get(normalizeId(sticker.id)) || null;

    return {
      id: sticker.id,
      section: sticker.section,
      number: String(sticker.num),
      rarity,
      weight: weightByRarity(rarity),
      imagePath,
      active: true,
    };
  });

  const withImage = payload.filter((x) => x.imagePath).length;
  const withoutImage = payload.length - withImage;

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      imagesDir,
      publicPrefix,
      total: payload.length,
      withImage,
      withoutImage,
    }, null, 2));
    return;
  }

  let createdOrUpdated = 0;
  for (const row of payload) {
    await prisma.stickerCatalog.upsert({
      where: { id: row.id },
      create: row,
      update: {
        section: row.section,
        number: row.number,
        rarity: row.rarity,
        weight: row.weight,
        active: row.active,
        ...(row.imagePath ? { imagePath: row.imagePath } : {}),
      },
    });
    createdOrUpdated += 1;
  }

  console.log(JSON.stringify({
    ok: true,
    imagesDir,
    publicPrefix,
    total: payload.length,
    createdOrUpdated,
    withImage,
    withoutImage,
  }, null, 2));
};

run()
  .catch((err) => {
    console.error("SEED_STICKERS_FAILED", err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
