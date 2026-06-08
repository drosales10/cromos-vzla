import "./loadEnv.js";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { ALL_CROMOS } from "../src/albumData.js";
import { registerQuinielaRoutes } from "./routes/quiniela.js";
import { awardTradePoints } from "./services/scoreEngine.js";
import { refreshAllStadiumWeather } from "./services/weatherService.js";
import {
  getPasswordResetConfig,
  requestPasswordReset,
  resetPasswordWithToken,
} from "./services/passwordResetService.js";
import { isEmailConfigured } from "./services/emailService.js";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.API_PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "cromos-dev-secret-change-me";
const DAILY_BONUS_COINS = Number(process.env.DAILY_BONUS_COINS || 20);
const DEFAULT_PACK_ID = "STD5";
const TRADE_TTL_HOURS = Number(process.env.TRADE_TTL_HOURS || 48);
const TRADE_EXPIRY_SWEEP_MS = Number(process.env.TRADE_EXPIRY_SWEEP_MS || 300000);
const WEATHER_REFRESH_MS = Number(process.env.WEATHER_REFRESH_MS || 86400000);
const TRADE_MAX_STICKERS_PER_SIDE = 5;
const VALID_STICKER_IDS = new Set(ALL_CROMOS.map((c) => c.id));
const APP_TIMEZONE = String(process.env.APP_TIMEZONE || process.env.TZ || "America/Caracas");
const API_JSON_LIMIT = String(process.env.API_JSON_LIMIT || "8mb");
const ALBUM_COVERS_SETTINGS_KEY = "album_cover_defaults";
const COVER_IMAGE_MAX_CHARS = 1_500_000;

if (!process.env.TZ) {
  process.env.TZ = APP_TIMEZONE;
}

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: API_JSON_LIMIT }));

const toBool = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const splitCsv = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};

const normalizeCoverImageValue = (value) => {
  if (!value) return "";
  if (typeof value !== "string") throw new ApiError(400, "La imagen de portada debe ser texto base64 o vacía");
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("data:image/")) {
    throw new ApiError(400, "La portada debe ser una Data URL de imagen");
  }
  if (trimmed.length > COVER_IMAGE_MAX_CHARS) {
    throw new ApiError(400, "La imagen de portada excede el tamaño permitido");
  }
  return trimmed;
};

const mapAlbumCoverDefaultsOut = (raw = {}) => {
  const coverFront = typeof raw?.coverFront === "string" ? raw.coverFront : "";
  const coverBack = typeof raw?.coverBack === "string" ? raw.coverBack : "";
  return { coverFront, coverBack };
};

const normalizeAlbumCoverDefaultsIn = (data = {}) => ({
  coverFront: normalizeCoverImageValue(data.coverFront),
  coverBack: normalizeCoverImageValue(data.coverBack),
});

const getTimezoneOffsetMs = (timeZone, date = new Date()) => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
};

const normalizeInventoryList = (rows = []) => rows
  .filter((r) => r?.stickerId && Number(r?.quantity || 0) > 0)
  .map((r) => ({ sticker_id: r.stickerId, quantity: Number(r.quantity || 0) }));

const buildInventoryMap = (rows = []) => {
  const out = {};
  rows.forEach((r) => {
    const qty = Number(r?.quantity || 0);
    if (qty > 0 && r?.stickerId) out[r.stickerId] = qty;
  });
  return out;
};

const getUserInventoryRows = async (tx, userId) => tx.userStickerInventory.findMany({
  where: { userId, quantity: { gt: 0 } },
  orderBy: [{ stickerId: "asc" }],
});

const getInventoryTimestamps = (rows = []) => {
  if (!rows || rows.length === 0) return { createdAt: null, updatedAt: null };
  const createdAt = rows.reduce((min, r) => (!min || new Date(r.createdAt) < new Date(min) ? r.createdAt : min), null);
  const updatedAt = rows.reduce((max, r) => (!max || new Date(r.updatedAt) > new Date(max) ? r.updatedAt : max), null);
  return { createdAt: createdAt || null, updatedAt: updatedAt || null };
};

const syncInventoryFromLegacyIfNeeded = async (tx, userId) => {
  const invCount = await tx.userStickerInventory.count({ where: { userId } });
  if (invCount > 0) return;

  const legacy = await tx.userCromos.findUnique({ where: { userId } });
  if (!legacy) return;

  const map = new Map();
  (legacy.have || []).forEach((id) => {
    if (!map.has(id)) map.set(id, 1);
  });
  (legacy.doubles || legacy.need || []).forEach((id) => {
    map.set(id, Math.max(2, map.get(id) || 0));
  });

  if (map.size === 0) return;
  await tx.userStickerInventory.createMany({
    data: Array.from(map.entries()).map(([stickerId, quantity]) => ({ userId, stickerId, quantity })),
    skipDuplicates: true,
  });
};

const mapAuditOut = (row) => ({
  id: row.id,
  actor_id: row.actorId,
  action: row.action,
  target_type: row.targetType,
  target_id: row.targetId,
  details: row.details,
  created_at: row.createdAt,
  actor: row.actor ? {
    id: row.actor.id,
    name: row.actor.name,
    username: row.actor.username,
    avatar_url: row.actor.avatarUrl,
  } : null,
});

const writeAuditLog = async ({ actorId = null, action, targetType, targetId = null, details = null }) => {
  try {
    if (!action || !targetType) return;
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error("AUDIT_LOG_WRITE_FAILED", err?.message || err);
  }
};

const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });

const readBearer = (header) => {
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = readBearer(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.profile.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.authUser = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const requireSuperuser = (req, _res, next) => {
  if (!req.authUser?.isSuperuser) return next(new ApiError(403, "Solo superusuario"));
  next();
};

const mapConversationOut = (row) => ({
  id: row.id,
  user1_id: row.user1Id,
  user2_id: row.user2Id,
  last_message: row.lastMessage,
  last_at: row.lastAt,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const mapMessageOut = (row) => ({
  id: row.id,
  conversation_id: row.conversationId,
  sender_id: row.senderId,
  text: row.text,
  created_at: row.createdAt,
});

const mapCromosFromInventory = (userId, inventoryRows = [], createdAt = null, updatedAt = null) => {
  const inventory = normalizeInventoryList(inventoryRows);
  return {
    user_id: userId,
    inventory,
    quantities: buildInventoryMap(inventoryRows),
    created_at: createdAt,
    updated_at: updatedAt,
  };
};

const mapProfileOut = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  email: row.email,
  city: row.city,
  whatsapp: row.whatsapp,
  provincia: row.provincia,
  canton: row.canton,
  avatar_url: row.avatarUrl,
  album_prefs: row.albumPrefs,
  groups: row.groups || [],
  blocked: row.blocked,
  is_admin: row.isAdmin,
  is_superuser: row.isSuperuser,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const mapGroupOut = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  code: row.code,
  admin_id: row.adminId,
  members: row.members || [],
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

const mapProfileIn = (data) => {
  const payload = { ...data };
  if (Object.prototype.hasOwnProperty.call(payload, "avatar_url")) {
    payload.avatarUrl = payload.avatar_url;
    delete payload.avatar_url;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "is_admin")) {
    payload.isAdmin = payload.is_admin;
    delete payload.is_admin;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "is_superuser")) {
    payload.isSuperuser = payload.is_superuser;
    delete payload.is_superuser;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "password_hash")) {
    payload.passwordHash = payload.password_hash;
    delete payload.password_hash;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "album_prefs")) {
    payload.albumPrefs = payload.album_prefs;
    delete payload.album_prefs;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "created_at")) delete payload.created_at;
  if (Object.prototype.hasOwnProperty.call(payload, "updated_at")) delete payload.updated_at;
  return payload;
};

const mapGroupIn = (data) => {
  const payload = { ...data };
  if (Object.prototype.hasOwnProperty.call(payload, "admin_id")) {
    payload.adminId = payload.admin_id;
    delete payload.admin_id;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "created_at")) delete payload.created_at;
  if (Object.prototype.hasOwnProperty.call(payload, "updated_at")) delete payload.updated_at;
  return payload;
};

const parseOptionalDate = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) throw new ApiError(400, `Fecha invalida en ${fieldName}`);
  return dt;
};

const parseOptionalPositiveInt = (value, fieldName, { allowNull = false } = {}) => {
  if (value === undefined) return undefined;
  if (allowNull && (value === null || value === "")) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) throw new ApiError(400, `${fieldName} debe ser >= 1`);
  return Math.floor(num);
};

const normalizeCouponInput = (data = {}, { partial = false } = {}) => {
  const out = {};

  if (!partial || Object.prototype.hasOwnProperty.call(data, "code")) {
    if (data.code === undefined && partial) {
      // skip for partial updates
    } else {
      const code = String(data.code || "").trim().toUpperCase();
      if (!code) throw new ApiError(400, "Codigo de cupon requerido");
      if (!/^[A-Z0-9_-]{4,32}$/.test(code)) {
        throw new ApiError(400, "Codigo invalido: usa 4-32 caracteres A-Z, 0-9, _ o -");
      }
      out.code = code;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "reward_type")) {
    if (data.reward_type === undefined && partial) {
      // skip
    } else {
      const rewardType = String(data.reward_type || "").trim().toUpperCase();
      if (rewardType !== "COINS" && rewardType !== "PACK") {
        throw new ApiError(400, "reward_type debe ser COINS o PACK");
      }
      out.rewardType = rewardType;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "coins_amount")) {
    const coins = parseOptionalPositiveInt(data.coins_amount, "coins_amount", { allowNull: true });
    if (coins !== undefined) out.coinsAmount = coins;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "pack_type_id")) {
    if (data.pack_type_id === undefined && partial) {
      // skip
    } else if (data.pack_type_id === null || data.pack_type_id === "") {
      out.packTypeId = null;
    } else {
      out.packTypeId = String(data.pack_type_id).trim().toUpperCase();
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "pack_quantity")) {
    const qty = parseOptionalPositiveInt(data.pack_quantity, "pack_quantity", { allowNull: false });
    if (qty !== undefined) out.packQuantity = qty;
  }

  const startsAt = parseOptionalDate(data.starts_at, "starts_at");
  if (startsAt !== undefined) out.startsAt = startsAt;
  const endsAt = parseOptionalDate(data.ends_at, "ends_at");
  if (endsAt !== undefined) out.endsAt = endsAt;

  if (!partial || Object.prototype.hasOwnProperty.call(data, "max_global_uses")) {
    const maxGlobalUses = parseOptionalPositiveInt(data.max_global_uses, "max_global_uses", { allowNull: true });
    if (maxGlobalUses !== undefined) out.maxGlobalUses = maxGlobalUses;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "max_per_user")) {
    const maxPerUser = parseOptionalPositiveInt(data.max_per_user, "max_per_user", { allowNull: false });
    if (maxPerUser !== undefined) out.maxPerUser = maxPerUser;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "active")) {
    if (data.active === undefined && partial) {
      // skip
    } else {
      out.active = Boolean(data.active);
    }
  }

  return out;
};

const couponStatus = (coupon, now = new Date()) => {
  if (!coupon.active) return "INACTIVE";

  // Compatibility: old auto-event coupons were created with startsAt ~= createdAt
  // and can appear as future due timestamp timezone drift.
  const hasImmediateStart = (() => {
    if (!coupon.startsAt || !coupon.createdAt) return false;
    const drift = new Date(coupon.startsAt).getTime() - new Date(coupon.createdAt).getTime();

    // expected immediate start
    if (Math.abs(drift) <= 5 * 60 * 1000) return true;

    // legacy auto-event timezone drift: +1h to +14h, typically exact hour offsets
    const hourMs = 60 * 60 * 1000;
    const roundedHours = Math.round(drift / hourMs);
    const nearestHourMs = roundedHours * hourMs;
    const nearHourOffset = Math.abs(drift - nearestHourMs) <= 10 * 60 * 1000;

    const timezoneOffsetMs = Math.abs(getTimezoneOffsetMs(APP_TIMEZONE, new Date(coupon.createdAt || now)));
    const nearConfiguredTimezoneOffset = timezoneOffsetMs > 0 && Math.abs(drift - timezoneOffsetMs) <= 15 * 60 * 1000;

    if (
      String(coupon.code || "").startsWith("FAM")
      && drift > 0
      && drift <= 14 * hourMs
      && roundedHours >= 1
      && (nearHourOffset || nearConfiguredTimezoneOffset)
    ) {
      return true;
    }

    return false;
  })();

  if (coupon.startsAt && now < new Date(coupon.startsAt) && !hasImmediateStart) return "SCHEDULED";
  if (coupon.endsAt && now > new Date(coupon.endsAt)) return "EXPIRED";
  if (coupon.maxGlobalUses !== null && coupon.maxGlobalUses !== undefined && coupon.usedCount >= coupon.maxGlobalUses) {
    return "EXHAUSTED";
  }
  return "ACTIVE";
};

const validateCouponModel = (coupon) => {
  if (coupon.startsAt && coupon.endsAt && new Date(coupon.endsAt) <= new Date(coupon.startsAt)) {
    throw new ApiError(400, "ends_at debe ser mayor que starts_at");
  }

  if (coupon.maxGlobalUses !== null && coupon.maxGlobalUses !== undefined && coupon.maxGlobalUses < coupon.usedCount) {
    throw new ApiError(400, "max_global_uses no puede ser menor que used_count");
  }

  if (coupon.rewardType === "COINS") {
    if (!coupon.coinsAmount || coupon.coinsAmount < 1) {
      throw new ApiError(400, "coins_amount es requerido para cupones COINS");
    }
  }

  if (coupon.rewardType === "PACK") {
    if (!coupon.packTypeId) throw new ApiError(400, "pack_type_id es requerido para cupones PACK");
    if (!coupon.packQuantity || coupon.packQuantity < 1) {
      throw new ApiError(400, "pack_quantity es requerido para cupones PACK");
    }
  }
};

const mapCouponOut = (coupon) => ({
  code: coupon.code,
  reward_type: coupon.rewardType,
  coins_amount: coupon.coinsAmount,
  pack_type_id: coupon.packTypeId,
  pack_quantity: coupon.packQuantity,
  starts_at: coupon.startsAt,
  ends_at: coupon.endsAt,
  max_global_uses: coupon.maxGlobalUses,
  max_per_user: coupon.maxPerUser,
  used_count: coupon.usedCount,
  active: coupon.active,
  status: couponStatus(coupon),
  created_by_user_id: coupon.createdByUserId,
  created_at: coupon.createdAt,
});

const ensureCouponPackType = async (tx, coupon, { requireActive = true } = {}) => {
  if (coupon.rewardType !== "PACK") return;
  const packType = await tx.packType.findUnique({ where: { id: coupon.packTypeId } });
  if (!packType) throw new ApiError(400, `pack_type_id invalido: ${coupon.packTypeId}`);
  if (requireActive && !packType.active) {
    throw new ApiError(400, `pack_type_id no disponible: ${coupon.packTypeId}`);
  }
};

let setupPromise = null;

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

const pickWeightedUnique = (pool, count) => {
  const candidates = [...pool];
  const out = [];
  const safeCount = Math.min(count, candidates.length);
  for (let i = 0; i < safeCount; i++) {
    const totalWeight = candidates.reduce((sum, x) => sum + x.weight, 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (; idx < candidates.length; idx++) {
      r -= candidates[idx].weight;
      if (r <= 0) break;
    }
    const chosen = candidates[Math.min(idx, candidates.length - 1)];
    out.push(chosen);
    candidates.splice(Math.min(idx, candidates.length - 1), 1);
  }
  return out;
};

const ensureGlobalEconomySetup = async () => {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    const pack = await prisma.packType.findUnique({ where: { id: DEFAULT_PACK_ID } });
    if (!pack) {
      await prisma.packType.create({
        data: { id: DEFAULT_PACK_ID, name: "Sobre Estándar", size: 5, priceCoins: 100, active: true },
      });
    }

    const count = await prisma.stickerCatalog.count();
    if (count === 0) {
      await prisma.stickerCatalog.createMany({
        data: ALL_CROMOS.map((sticker) => {
          const rarity = getRarityBySticker(sticker);
          return {
            id: sticker.id,
            section: sticker.section,
            number: sticker.num,
            rarity,
            weight: weightByRarity(rarity),
          };
        }),
      });
    }
  })();

  return setupPromise;
};

const ensureUserEconomy = async (tx, userId) => {
  await tx.userWallet.upsert({
    where: { userId },
    create: { userId, coins: 120 },
    update: {},
  });

  await tx.userPackInventory.upsert({
    where: { userId_packTypeId: { userId, packTypeId: DEFAULT_PACK_ID } },
    create: { userId, packTypeId: DEFAULT_PACK_ID, quantity: 0 },
    update: {},
  });
};

const expirePendingTrades = async () => {
  const now = new Date();
  const out = await prisma.tradeProposal.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED", respondedAt: now },
  });
  return out.count || 0;
};

const countStickerIds = (ids = []) => {
  const counts = {};
  ids.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
};

const validateTradeStickerIds = (ids, label) => {
  const invalid = [...new Set(ids.filter((id) => !VALID_STICKER_IDS.has(id)))];
  if (invalid.length > 0) {
    const preview = invalid.slice(0, 3).join(", ");
    const suffix = invalid.length > 3 ? "..." : "";
    throw new ApiError(400, `${label}: cromos inválidos (${preview}${suffix})`);
  }
};

const getPendingGiveCommitments = async (tx, userId, excludeTradeId = null) => {
  const pending = await tx.tradeProposal.findMany({
    where: {
      fromUserId: userId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
      ...(excludeTradeId ? { id: { not: excludeTradeId } } : {}),
    },
    select: { giveIds: true },
  });

  const committed = {};
  pending.forEach((trade) => {
    trade.giveIds.forEach((id) => {
      committed[id] = (committed[id] || 0) + 1;
    });
  });
  return committed;
};

const validateGiveAvailability = (qtyMap, giveIds, pendingCommitted = {}) => {
  const needed = countStickerIds(giveIds);
  Object.entries(needed).forEach(([id, count]) => {
    const owned = Number(qtyMap[id] || 0);
    if (owned <= 1) throw new ApiError(400, "Solo puedes ofrecer cromos repetidos");
    const reserved = Number(pendingCommitted[id] || 0);
    const available = Math.max(0, owned - 1 - reserved);
    if (count > available) {
      throw new ApiError(400, "No tienes suficientes repetidas disponibles (algunas ya están en propuestas pendientes)");
    }
  });
};

const validateReceiveDoubles = (qtyMap, receiveIds) => {
  const needed = countStickerIds(receiveIds);
  Object.entries(needed).forEach(([id, count]) => {
    const owned = Number(qtyMap[id] || 0);
    if (owned <= 1) throw new ApiError(400, "El destinatario no tiene suficientes repetidas de lo que solicitas");
    const available = Math.max(0, owned - 1);
    if (count > available) {
      throw new ApiError(400, "El destinatario no tiene suficientes repetidas de lo que solicitas");
    }
  });
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const normalizeUsername = (value) => (
  String(value || "").trim().toLowerCase().replace(/\s/g, "")
);

/** Público: verificar si un nombre de usuario está libre (registro). */
app.get("/api/auth/username-available/:username", async (req, res, next) => {
  try {
    const username = normalizeUsername(req.params.username);
    if (username.length < 3) {
      return res.status(400).json({ available: false, error: "Usuario muy corto" });
    }
    const existing = await prisma.profile.findUnique({
      where: { username },
      select: { id: true },
    });
    res.json({ available: !existing, username });
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const username = normalizeUsername(req.body.username);
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must have at least 6 characters" });
    }

    const existing = await prisma.profile.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { id: true },
    });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.profile.create({
        data: {
          id,
          name,
          username,
          email,
          passwordHash,
          city: req.body.city || "",
          whatsapp: req.body.whatsapp || "",
          provincia: req.body.provincia || "",
          canton: req.body.canton || "",
          groups: [],
        },
      });

      return created;
    });

    const token = signToken(profile.id);
    res.status(201).json({ token, profile: mapProfileOut(profile) });
  } catch (err) {
    next(err);
  }
});

const handleRecoveryStatus = (_req, res) => {
  res.json(getPasswordResetConfig());
};

const handleRecoveryRequest = async (req, res, next) => {
  try {
    const result = await requestPasswordReset(prisma, req.body?.email);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

const handleRecoveryConfirm = async (req, res, next) => {
  try {
    const result = await resetPasswordWithToken(
      prisma,
      req.body?.token,
      req.body?.password,
    );
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

// Rutas sin "password"/"forgot" — Cloudflare WAF las bloquea con 403
app.get("/api/auth/recovery-status", handleRecoveryStatus);
app.post("/api/auth/recovery-request", handleRecoveryRequest);
app.post("/api/auth/recovery-confirm", handleRecoveryConfirm);

// Alias legacy (pueden fallar detrás de WAF)
app.get("/api/auth/password-reset-status", handleRecoveryStatus);
app.post("/api/auth/forgot-password", handleRecoveryRequest);
app.post("/api/auth/reset-password", handleRecoveryConfirm);

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile || !profile.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, profile.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    if (profile.blocked) return res.status(403).json({ error: "Account blocked" });

    const token = signToken(profile.id);
    res.json({ token, profile: mapProfileOut(profile) });
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  res.json({ profile: mapProfileOut(req.authUser) });
});

app.get("/api/economy/me", requireAuth, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const out = await prisma.$transaction(async (tx) => {
      await ensureUserEconomy(tx, req.authUser.id);

      const wallet = await tx.userWallet.findUnique({ where: { userId: req.authUser.id } });
      const packs = await tx.userPackInventory.findMany({
        where: { userId: req.authUser.id },
        include: { packType: true },
      });

      return { wallet, packs };
    });

    const canClaimDaily = !out.wallet.lastDailyClaimAt || (Date.now() - new Date(out.wallet.lastDailyClaimAt).getTime()) >= 24 * 60 * 60 * 1000;
    res.json({
      wallet: {
        user_id: out.wallet.userId,
        coins: out.wallet.coins,
        last_daily_claim_at: out.wallet.lastDailyClaimAt,
        can_claim_daily: canClaimDaily,
        daily_bonus: DAILY_BONUS_COINS,
      },
      packs: out.packs.map((p) => ({
        pack_type_id: p.packTypeId,
        quantity: p.quantity,
        pack_type: {
          id: p.packType.id,
          name: p.packType.name,
          size: p.packType.size,
          price_coins: p.packType.priceCoins,
          active: p.packType.active,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/economy/daily-claim", requireAuth, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const out = await prisma.$transaction(async (tx) => {
      await ensureUserEconomy(tx, req.authUser.id);

      const wallet = await tx.userWallet.findUnique({ where: { userId: req.authUser.id } });
      const now = new Date();
      if (wallet.lastDailyClaimAt) {
        const elapsed = now.getTime() - new Date(wallet.lastDailyClaimAt).getTime();
        if (elapsed < 24 * 60 * 60 * 1000) {
          const nextAt = new Date(new Date(wallet.lastDailyClaimAt).getTime() + 24 * 60 * 60 * 1000);
          throw new ApiError(400, "Ya reclamaste el bono diario", { next_at: nextAt });
        }
      }

      const updated = await tx.userWallet.update({
        where: { userId: req.authUser.id },
        data: { coins: { increment: DAILY_BONUS_COINS }, lastDailyClaimAt: now },
      });

      await tx.walletLedger.create({
        data: {
          userId: req.authUser.id,
          entryType: "DAILY_BONUS",
          amount: DAILY_BONUS_COINS,
          balanceAfter: updated.coins,
          reason: "Bono diario",
        },
      });

      return updated;
    });

    res.json({ wallet: { coins: out.coins, last_daily_claim_at: out.lastDailyClaimAt } });
  } catch (err) {
    next(err);
  }
});

app.post("/api/economy/buy-pack", requireAuth, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();
    const packTypeId = String(req.body.pack_type_id || DEFAULT_PACK_ID);
    const quantity = Math.max(1, Math.min(20, Number(req.body.quantity || 1)));

    const out = await prisma.$transaction(async (tx) => {
      await ensureUserEconomy(tx, req.authUser.id);

      const [wallet, packType] = await Promise.all([
        tx.userWallet.findUnique({ where: { userId: req.authUser.id } }),
        tx.packType.findUnique({ where: { id: packTypeId } }),
      ]);

      if (!packType || !packType.active) throw new ApiError(404, "Tipo de sobre no disponible");

      const totalCost = packType.priceCoins * quantity;
      if (wallet.coins < totalCost) throw new ApiError(400, "Monedas insuficientes");

      const updatedWallet = await tx.userWallet.update({
        where: { userId: req.authUser.id },
        data: { coins: { decrement: totalCost } },
      });

      const inv = await tx.userPackInventory.upsert({
        where: { userId_packTypeId: { userId: req.authUser.id, packTypeId } },
        create: { userId: req.authUser.id, packTypeId, quantity },
        update: { quantity: { increment: quantity } },
      });

      await tx.walletLedger.create({
        data: {
          userId: req.authUser.id,
          entryType: "PACK_PURCHASE",
          amount: -totalCost,
          balanceAfter: updatedWallet.coins,
          reason: `Compra de ${quantity} sobre(s)`,
          metadata: { pack_type_id: packTypeId, quantity },
        },
      });

      return { wallet: updatedWallet, inventory: inv, totalCost };
    });

    res.json({
      wallet: { coins: out.wallet.coins },
      purchased: { pack_type_id: packTypeId, quantity, cost_coins: out.totalCost },
      inventory: { pack_type_id: packTypeId, quantity: out.inventory.quantity },
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/economy/open-pack", requireAuth, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const packTypeId = String(req.body.pack_type_id || DEFAULT_PACK_ID);
    const quantity = Math.max(1, Math.min(10, Number(req.body.quantity || 1)));
    const source = String(req.body.source || "INVENTORY");

    const out = await prisma.$transaction(async (tx) => {
      await ensureUserEconomy(tx, req.authUser.id);
      await syncInventoryFromLegacyIfNeeded(tx, req.authUser.id);

      const [packType, inventory, stickers] = await Promise.all([
        tx.packType.findUnique({ where: { id: packTypeId } }),
        tx.userPackInventory.findUnique({ where: { userId_packTypeId: { userId: req.authUser.id, packTypeId } } }),
        tx.stickerCatalog.findMany({ where: { active: true } }),
      ]);

      if (!packType || !packType.active) throw new ApiError(404, "Tipo de sobre no disponible");
      if (!inventory || inventory.quantity < quantity) throw new ApiError(400, "No tienes suficientes sobres");
      if (stickers.length < packType.size) throw new ApiError(500, "Pool de barajitas insuficiente");

      await tx.userPackInventory.update({
        where: { userId_packTypeId: { userId: req.authUser.id, packTypeId } },
        data: { quantity: { decrement: quantity } },
      });

      const currentRows = await getUserInventoryRows(tx, req.authUser.id);
      const quantities = buildInventoryMap(currentRows);
      const openings = [];

      for (let i = 0; i < quantity; i++) {
        const opening = await tx.packOpening.create({
          data: { userId: req.authUser.id, packTypeId, source, costCoins: 0 },
        });

        const picks = pickWeightedUnique(stickers, packType.size);
        const items = picks.map((pick, idx) => {
          const beforeQty = Number(quantities[pick.id] || 0);
          const nextQty = beforeQty + 1;
          const isNew = beforeQty === 0;
          const isDouble = beforeQty >= 1;
          quantities[pick.id] = nextQty;

          return {
            openingId: opening.id,
            slot: idx + 1,
            stickerId: pick.id,
            isNew,
            isDouble,
            quantityAfter: nextQty,
          };
        });

        await tx.packOpeningItem.createMany({
          data: items.map((it) => ({
            openingId: it.openingId,
            slot: it.slot,
            stickerId: it.stickerId,
            isNew: it.isNew,
            isDouble: it.isDouble,
          })),
        });

        openings.push({
          id: opening.id,
          pack_type_id: packTypeId,
          created_at: opening.createdAt,
          items: items.map((it) => {
            const sticker = picks.find((x) => x.id === it.stickerId);
            return {
              slot: it.slot,
              sticker_id: it.stickerId,
              section: sticker.section,
              number: sticker.number,
              rarity: sticker.rarity,
              image_path: sticker.imagePath,
              is_new: it.isNew,
              is_double: it.isDouble,
              quantity_after: it.quantityAfter,
            };
          }),
        });
      }

      const nextRows = Object.entries(quantities)
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([stickerId, quantity]) => ({ userId: req.authUser.id, stickerId, quantity: Number(quantity) }));

      await tx.userStickerInventory.deleteMany({ where: { userId: req.authUser.id } });
      if (nextRows.length > 0) {
        await tx.userStickerInventory.createMany({ data: nextRows });
      }

      const haveIds = nextRows.filter((r) => r.quantity > 0).map((r) => r.stickerId);
      const doublesIds = nextRows.filter((r) => r.quantity > 1).map((r) => r.stickerId);

      const updatedInventory = await tx.userPackInventory.findUnique({
        where: { userId_packTypeId: { userId: req.authUser.id, packTypeId } },
      });

      return {
        openings,
        inventory: updatedInventory,
        haveCount: haveIds.length,
        doublesCount: doublesIds.length,
        quantities,
      };
    });

    res.json({
      pack_type_id: packTypeId,
      opened_quantity: quantity,
      inventory: { quantity: out.inventory?.quantity || 0 },
      summary: { have_count: out.haveCount, doubles_count: out.doublesCount },
      quantities: out.quantities,
      openings: out.openings,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/stickers/catalog", requireAuth, async (req, res, next) => {
  try {
    const section = req.query.section ? String(req.query.section).trim().toUpperCase() : undefined;
    const rows = await prisma.stickerCatalog.findMany({
      where: {
        ...(section ? { section } : {}),
      },
      select: {
        id: true,
        section: true,
        number: true,
        rarity: true,
        imagePath: true,
        active: true,
      },
      orderBy: [{ section: "asc" }, { number: "asc" }],
    });

    res.json(rows.map((s) => ({
      id: s.id,
      section: s.section,
      number: s.number,
      rarity: s.rarity,
      image_path: s.imagePath,
      active: s.active,
    })));
  } catch (err) {
    next(err);
  }
});

app.post("/api/economy/coupon/redeem", requireAuth, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) throw new ApiError(400, "Código requerido");

    const out = await prisma.$transaction(async (tx) => {
      await ensureUserEconomy(tx, req.authUser.id);

      const coupon = await tx.coupon.findUnique({ where: { code } });
      if (!coupon) throw new ApiError(404, "Cupón inválido");

      const now = new Date();
      const status = couponStatus(coupon, now);
      if (status === "INACTIVE") throw new ApiError(404, "Cupón inválido");
      if (status === "SCHEDULED") throw new ApiError(400, "Cupón aún no activo");
      if (status === "EXPIRED") throw new ApiError(400, "Cupón expirado");
      if (status === "EXHAUSTED") throw new ApiError(400, "Cupón agotado");

      const usedByMe = await tx.couponRedemption.count({ where: { code, userId: req.authUser.id } });
      if (usedByMe >= coupon.maxPerUser) throw new ApiError(400, "Ya usaste este cupón");

      let reward = {};

      if (coupon.rewardType === "COINS") {
        const coins = coupon.coinsAmount || 0;
        const wallet = await tx.userWallet.update({
          where: { userId: req.authUser.id },
          data: { coins: { increment: coins } },
        });
        await tx.walletLedger.create({
          data: {
            userId: req.authUser.id,
            entryType: "COUPON_REWARD",
            amount: coins,
            balanceAfter: wallet.coins,
            reason: `Cupón ${code}`,
          },
        });
        reward = { type: "COINS", coins, wallet_coins: wallet.coins };
      } else {
        const packTypeId = coupon.packTypeId || DEFAULT_PACK_ID;
        const qty = coupon.packQuantity || 1;

        const inv = await tx.userPackInventory.upsert({
          where: { userId_packTypeId: { userId: req.authUser.id, packTypeId } },
          create: { userId: req.authUser.id, packTypeId, quantity: qty },
          update: { quantity: { increment: qty } },
        });

        reward = { type: "PACK", pack_type_id: packTypeId, quantity: qty, inventory_quantity: inv.quantity };
      }

      await tx.coupon.update({ where: { code }, data: { usedCount: { increment: 1 } } });
      await tx.couponRedemption.create({ data: { code, userId: req.authUser.id } });

      return reward;
    });

    res.json({ code, reward: out });
  } catch (err) {
    next(err);
  }
});

app.get("/api/economy/coupon/redemptions", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));

    const rows = await prisma.couponRedemption.findMany({
      where: { userId: req.authUser.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        coupon: true,
      },
    });

    res.json(rows.map((r) => ({
      id: r.id,
      code: r.code,
      created_at: r.createdAt,
      reward: r.coupon ? {
        type: r.coupon.rewardType,
        coins_amount: r.coupon.coinsAmount,
        pack_type_id: r.coupon.packTypeId,
        pack_quantity: r.coupon.packQuantity,
      } : null,
    })));
  } catch (err) {
    next(err);
  }
});

app.get("/api/settings/album-covers", requireAuth, async (req, res, next) => {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: ALBUM_COVERS_SETTINGS_KEY } });
    res.json(mapAlbumCoverDefaultsOut(row?.value || {}));
  } catch (err) {
    next(err);
  }
});

app.get("/api/admin/settings/album-covers", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: ALBUM_COVERS_SETTINGS_KEY } });
    res.json(mapAlbumCoverDefaultsOut(row?.value || {}));
  } catch (err) {
    next(err);
  }
});

app.put("/api/admin/settings/album-covers", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const payload = normalizeAlbumCoverDefaultsIn(req.body || {});

    const saved = await prisma.appSetting.upsert({
      where: { key: ALBUM_COVERS_SETTINGS_KEY },
      create: {
        key: ALBUM_COVERS_SETTINGS_KEY,
        value: payload,
      },
      update: {
        value: payload,
      },
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "ALBUM_COVERS_DEFAULTS_UPDATED",
      targetType: "APP_SETTING",
      targetId: ALBUM_COVERS_SETTINGS_KEY,
      details: {
        cover_front: payload.coverFront ? "configured" : "empty",
        cover_back: payload.coverBack ? "configured" : "empty",
      },
    });

    res.json(mapAlbumCoverDefaultsOut(saved.value || {}));
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/coupons/auto-event", requireAuth, async (req, res, next) => {
  try {
    if (!req.authUser.isSuperuser) throw new ApiError(403, "Solo superusuario");
    await ensureGlobalEconomySetup();

    const rewardType = String(req.body.reward_type || "PACK").toUpperCase();
    const durationHours = Math.max(1, Math.min(168, Number(req.body.duration_hours || 48)));
    const maxGlobalUses = req.body.max_global_uses === undefined ? 50 : Number(req.body.max_global_uses);
    const maxPerUser = Math.max(1, Math.min(10, Number(req.body.max_per_user || 1)));
    const code = `FAM${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = new Date();
    const startsAt = null;
    const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const coupon = await prisma.$transaction(async (tx) => {
      const candidate = {
        code,
        rewardType: rewardType === "COINS" ? "COINS" : "PACK",
        coinsAmount: rewardType === "COINS" ? Math.max(1, Number(req.body.coins_amount || 50)) : null,
        packTypeId: rewardType === "PACK" ? String(req.body.pack_type_id || DEFAULT_PACK_ID).trim().toUpperCase() : null,
        packQuantity: rewardType === "PACK" ? Math.max(1, Number(req.body.pack_quantity || 1)) : 1,
        startsAt,
        endsAt,
        maxGlobalUses,
        maxPerUser,
        usedCount: 0,
        active: true,
        createdByUserId: req.authUser.id,
        createdAt: new Date(),
      };

      validateCouponModel(candidate);
      await ensureCouponPackType(tx, candidate);
      return tx.coupon.create({ data: candidate });
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "COUPON_AUTO_EVENT_CREATED",
      targetType: "COUPON",
      targetId: coupon.code,
      details: {
        reward_type: coupon.rewardType,
        max_global_uses: coupon.maxGlobalUses,
        max_per_user: coupon.maxPerUser,
      },
    });

    res.status(201).json({ coupon: mapCouponOut(coupon) });
  } catch (err) {
    next(err);
  }
});

app.get("/api/admin/coupons", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const limit = Math.max(1, Math.min(300, Number(req.query.limit || 120)));
    const search = req.query.search ? String(req.query.search).trim().toUpperCase() : "";
    const rewardType = req.query.reward_type ? String(req.query.reward_type).trim().toUpperCase() : "";
    const active = toBool(req.query.active);
    const status = req.query.status ? String(req.query.status).trim().toUpperCase() : "";

    const where = {
      ...(search ? { code: { contains: search, mode: "insensitive" } } : {}),
      ...(rewardType === "COINS" || rewardType === "PACK" ? { rewardType } : {}),
      ...(active === undefined ? {} : { active }),
    };

    const rows = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const out = rows.map(mapCouponOut);
    const filtered = ["ACTIVE", "SCHEDULED", "EXPIRED", "EXHAUSTED", "INACTIVE"].includes(status)
      ? out.filter((c) => c.status === status)
      : out;

    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/coupons", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const payload = normalizeCouponInput(req.body, { partial: false });
    const rewardType = payload.rewardType || "PACK";

    const candidate = {
      code: payload.code,
      rewardType,
      coinsAmount: rewardType === "COINS" ? (payload.coinsAmount || 0) : null,
      packTypeId: rewardType === "PACK" ? (payload.packTypeId || DEFAULT_PACK_ID) : null,
      packQuantity: rewardType === "PACK" ? (payload.packQuantity || 1) : 1,
      startsAt: payload.startsAt ?? null,
      endsAt: payload.endsAt ?? null,
      maxGlobalUses: payload.maxGlobalUses ?? null,
      maxPerUser: payload.maxPerUser || 1,
      usedCount: 0,
      active: payload.active !== undefined ? payload.active : true,
      createdByUserId: req.authUser.id,
      createdAt: new Date(),
    };

    validateCouponModel(candidate);

    const created = await prisma.$transaction(async (tx) => {
      await ensureCouponPackType(tx, candidate);
      return tx.coupon.create({ data: candidate });
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "COUPON_CREATED",
      targetType: "COUPON",
      targetId: created.code,
      details: {
        reward_type: created.rewardType,
        active: created.active,
        max_global_uses: created.maxGlobalUses,
        max_per_user: created.maxPerUser,
      },
    });

    res.status(201).json({ coupon: mapCouponOut(created) });
  } catch (err) {
    next(err);
  }
});

app.patch("/api/admin/coupons/:code", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    await ensureGlobalEconomySetup();

    const code = String(req.params.code || "").trim().toUpperCase();
    if (!code) throw new ApiError(400, "Codigo de cupon requerido");

    const current = await prisma.coupon.findUnique({ where: { code } });
    if (!current) throw new ApiError(404, "Cupón no encontrado");

    const patch = normalizeCouponInput(req.body, { partial: true });
    const nextRewardType = patch.rewardType || current.rewardType;

    const candidate = {
      ...current,
      rewardType: nextRewardType,
      coinsAmount: nextRewardType === "COINS"
        ? (patch.coinsAmount !== undefined ? patch.coinsAmount : current.coinsAmount)
        : null,
      packTypeId: nextRewardType === "PACK"
        ? (patch.packTypeId !== undefined ? patch.packTypeId : current.packTypeId)
        : null,
      packQuantity: nextRewardType === "PACK"
        ? (patch.packQuantity !== undefined ? patch.packQuantity : current.packQuantity)
        : 1,
      startsAt: patch.startsAt !== undefined ? patch.startsAt : current.startsAt,
      endsAt: patch.endsAt !== undefined ? patch.endsAt : current.endsAt,
      maxGlobalUses: patch.maxGlobalUses !== undefined ? patch.maxGlobalUses : current.maxGlobalUses,
      maxPerUser: patch.maxPerUser !== undefined ? patch.maxPerUser : current.maxPerUser,
      active: patch.active !== undefined ? patch.active : current.active,
    };

    validateCouponModel(candidate);

    const updated = await prisma.$transaction(async (tx) => {
      await ensureCouponPackType(tx, candidate);
      return tx.coupon.update({
        where: { code },
        data: {
          rewardType: candidate.rewardType,
          coinsAmount: candidate.coinsAmount,
          packTypeId: candidate.packTypeId,
          packQuantity: candidate.packQuantity,
          startsAt: candidate.startsAt,
          endsAt: candidate.endsAt,
          maxGlobalUses: candidate.maxGlobalUses,
          maxPerUser: candidate.maxPerUser,
          active: candidate.active,
        },
      });
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "COUPON_UPDATED",
      targetType: "COUPON",
      targetId: updated.code,
      details: {
        reward_type: updated.rewardType,
        active: updated.active,
        max_global_uses: updated.maxGlobalUses,
        max_per_user: updated.maxPerUser,
      },
    });

    res.json({ coupon: mapCouponOut(updated) });
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/coupons/:code/toggle", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const code = String(req.params.code || "").trim().toUpperCase();
    if (!code) throw new ApiError(400, "Codigo de cupon requerido");

    const enabled = Boolean(req.body?.enabled);
    const current = await prisma.coupon.findUnique({ where: { code } });
    if (!current) throw new ApiError(404, "Cupón no encontrado");

    const updated = await prisma.coupon.update({
      where: { code },
      data: { active: enabled },
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "COUPON_TOGGLED",
      targetType: "COUPON",
      targetId: updated.code,
      details: { enabled, previous_active: current.active },
    });

    res.json({ coupon: mapCouponOut(updated) });
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/users/:id/superuser", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const targetId = String(req.params.id || "");
    const enabled = Boolean(req.body?.enabled);

    const target = await prisma.profile.findUnique({ where: { id: targetId } });
    if (!target) throw new ApiError(404, "Usuario no encontrado");

    if (target.id === req.authUser.id && !enabled) {
      throw new ApiError(400, "No puedes quitarte el rol de superusuario");
    }

    if (!enabled) {
      const totalSuperusers = await prisma.profile.count({ where: { isSuperuser: true } });
      if (target.isSuperuser && totalSuperusers <= 1) {
        throw new ApiError(400, "Debe existir al menos un superusuario");
      }
    }

    const updated = await prisma.profile.update({
      where: { id: target.id },
      data: {
        isSuperuser: enabled,
        isAdmin: enabled ? true : target.isAdmin,
      },
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "SUPERUSER_ROLE_CHANGED",
      targetType: "PROFILE",
      targetId: updated.id,
      details: { enabled, previous_is_superuser: target.isSuperuser },
    });

    res.json({
      id: updated.id,
      is_superuser: updated.isSuperuser,
      is_admin: updated.isAdmin,
      audit: {
        actor_id: req.authUser.id,
        target_id: updated.id,
        enabled,
        at: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/admin/audit-logs", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const action = req.query.action ? String(req.query.action).trim() : undefined;
    const targetType = req.query.target_type ? String(req.query.target_type).trim() : undefined;

    const rows = await prisma.auditLog.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(targetType ? { targetType } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
      take: limit,
    });

    res.json(rows.map(mapAuditOut));
  } catch (err) {
    next(err);
  }
});

app.get("/api/admin/stickers", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const section = String(req.query.section || "").trim().toUpperCase();
    const active = req.query.active;

    const where = {
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: "insensitive" } },
              { section: { contains: search, mode: "insensitive" } },
              { number: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(section ? { section } : {}),
      ...(active === undefined ? {} : { active: String(active) === "true" }),
    };

    const rows = await prisma.stickerCatalog.findMany({
      where,
      orderBy: [{ section: "asc" }, { number: "asc" }],
      take: 500,
    });

    res.json(rows.map((s) => ({
      id: s.id,
      section: s.section,
      number: s.number,
      rarity: s.rarity,
      weight: s.weight,
      image_path: s.imagePath,
      active: s.active,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    })));
  } catch (err) {
    next(err);
  }
});

app.post("/api/admin/stickers", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const id = String(req.body.id || "").trim().toUpperCase();
    const section = String(req.body.section || "").trim().toUpperCase();
    const number = String(req.body.number || "").trim();
    const rarityRaw = String(req.body.rarity || "COMMON").toUpperCase();
    const rarity = ["COMMON", "SPECIAL", "GOLD"].includes(rarityRaw) ? rarityRaw : "COMMON";
    const weight = Math.max(1, Math.min(10000, Number(req.body.weight || 100)));
    const imagePath = req.body.image_path ? String(req.body.image_path) : null;
    const active = req.body.active === undefined ? true : Boolean(req.body.active);

    if (!id || !section || !number) throw new ApiError(400, "id, section y number son requeridos");

    const row = await prisma.stickerCatalog.upsert({
      where: { id },
      create: { id, section, number, rarity, weight, imagePath, active },
      update: { section, number, rarity, weight, imagePath, active },
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "STICKER_POOL_UPSERT",
      targetType: "STICKER",
      targetId: row.id,
      details: { section: row.section, number: row.number, rarity: row.rarity, active: row.active },
    });

    res.status(201).json({
      id: row.id,
      section: row.section,
      number: row.number,
      rarity: row.rarity,
      weight: row.weight,
      image_path: row.imagePath,
      active: row.active,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

app.patch("/api/admin/stickers/:id", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    const id = String(req.params.id || "").trim().toUpperCase();
    if (!id) throw new ApiError(400, "id requerido");

    const data = {};
    if (req.body.section !== undefined) data.section = String(req.body.section).trim().toUpperCase();
    if (req.body.number !== undefined) data.number = String(req.body.number).trim();
    if (req.body.rarity !== undefined) {
      const rarityRaw = String(req.body.rarity).toUpperCase();
      data.rarity = ["COMMON", "SPECIAL", "GOLD"].includes(rarityRaw) ? rarityRaw : "COMMON";
    }
    if (req.body.weight !== undefined) data.weight = Math.max(1, Math.min(10000, Number(req.body.weight || 100)));
    if (Object.prototype.hasOwnProperty.call(req.body, "image_path")) data.imagePath = req.body.image_path ? String(req.body.image_path) : null;
    if (req.body.active !== undefined) data.active = Boolean(req.body.active);

    const row = await prisma.stickerCatalog.update({ where: { id }, data });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "STICKER_POOL_UPDATE",
      targetType: "STICKER",
      targetId: row.id,
      details: { updated_fields: Object.keys(data), active: row.active },
    });

    res.json({
      id: row.id,
      section: row.section,
      number: row.number,
      rarity: row.rarity,
      weight: row.weight,
      image_path: row.imagePath,
      active: row.active,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/trades", requireAuth, async (req, res, next) => {
  try {
    await expirePendingTrades();

    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const rows = await prisma.tradeProposal.findMany({
      where: {
        AND: [
          { OR: [{ fromUserId: req.authUser.id }, { toUserId: req.authUser.id }] },
          ...(status ? [{ status }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: { select: { id: true, name: true, username: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    res.json(rows.map((t) => ({
      id: t.id,
      status: t.status,
      from_user_id: t.fromUserId,
      to_user_id: t.toUserId,
      give_ids: t.giveIds,
      receive_ids: t.receiveIds,
      note: t.note,
      created_at: t.createdAt,
      expires_at: t.expiresAt,
      responded_at: t.respondedAt,
      from_user: {
        id: t.fromUser.id,
        name: t.fromUser.name,
        username: t.fromUser.username,
        avatar_url: t.fromUser.avatarUrl,
      },
      to_user: {
        id: t.toUser.id,
        name: t.toUser.name,
        username: t.toUser.username,
        avatar_url: t.toUser.avatarUrl,
      },
    })));
  } catch (err) {
    next(err);
  }
});

app.post("/api/trades/propose", requireAuth, async (req, res, next) => {
  try {
    const toUserId = String(req.body.to_user_id || "");
    const giveIds = Array.isArray(req.body.give_ids) ? req.body.give_ids.map(String) : [];
    const receiveIds = Array.isArray(req.body.receive_ids) ? req.body.receive_ids.map(String) : [];
    const note = req.body.note ? String(req.body.note).slice(0, 500) : null;

    if (!toUserId) throw new ApiError(400, "Falta destinatario del trueque");
    if (toUserId === req.authUser.id) throw new ApiError(400, "No puedes proponerte un trueque a vos mismo");
    if (giveIds.length === 0 && receiveIds.length === 0) throw new ApiError(400, "Selecciona al menos una barajita");
    if (giveIds.length > TRADE_MAX_STICKERS_PER_SIDE || receiveIds.length > TRADE_MAX_STICKERS_PER_SIDE) {
      throw new ApiError(400, `Máximo ${TRADE_MAX_STICKERS_PER_SIDE} cromos por lado`);
    }

    validateTradeStickerIds(giveIds, "Oferta");
    validateTradeStickerIds(receiveIds, "Solicitud");

    const trade = await prisma.$transaction(async (tx) => {
      const toUser = await tx.profile.findUnique({ where: { id: toUserId } });
      if (!toUser || toUser.blocked) throw new ApiError(404, "Usuario destino no disponible");

      await syncInventoryFromLegacyIfNeeded(tx, req.authUser.id);
      await syncInventoryFromLegacyIfNeeded(tx, toUserId);

      const [myRows, theirRows, pendingCommitted] = await Promise.all([
        getUserInventoryRows(tx, req.authUser.id),
        getUserInventoryRows(tx, toUserId),
        getPendingGiveCommitments(tx, req.authUser.id),
      ]);

      const myQty = buildInventoryMap(myRows);
      const theirQty = buildInventoryMap(theirRows);

      validateGiveAvailability(myQty, giveIds, pendingCommitted);
      if (receiveIds.length > 0) validateReceiveDoubles(theirQty, receiveIds);

      return tx.tradeProposal.create({
        data: {
          fromUserId: req.authUser.id,
          toUserId,
          giveIds,
          receiveIds,
          note,
          status: "PENDING",
          expiresAt: new Date(Date.now() + TRADE_TTL_HOURS * 60 * 60 * 1000),
        },
      });
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "TRADE_PROPOSED",
      targetType: "trade",
      targetId: trade.id,
      details: { to_user_id: toUserId, give_count: giveIds.length, receive_count: receiveIds.length },
    });

    res.status(201).json({
      id: trade.id,
      status: trade.status,
      from_user_id: trade.fromUserId,
      to_user_id: trade.toUserId,
      give_ids: trade.giveIds,
      receive_ids: trade.receiveIds,
      note: trade.note,
      created_at: trade.createdAt,
      expires_at: trade.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/trades/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const tradeId = req.params.id;

    const out = await prisma.$transaction(async (tx) => {
      const trade = await tx.tradeProposal.findUnique({ where: { id: tradeId } });
      if (!trade) throw new ApiError(404, "Trueque no encontrado");
      if (trade.toUserId !== req.authUser.id) throw new ApiError(403, "No autorizado para aceptar este trueque");
      if (trade.status !== "PENDING") throw new ApiError(400, "Este trueque ya fue procesado");
      if (!trade.expiresAt || new Date(trade.expiresAt).getTime() < Date.now()) {
        await tx.tradeProposal.update({
          where: { id: tradeId },
          data: { status: "EXPIRED", respondedAt: new Date() },
        });
        throw new ApiError(400, "Este trueque expiró");
      }

      await syncInventoryFromLegacyIfNeeded(tx, trade.fromUserId);
      await syncInventoryFromLegacyIfNeeded(tx, trade.toUserId);

      const [fromRows, toRows, pendingCommitted] = await Promise.all([
        getUserInventoryRows(tx, trade.fromUserId),
        getUserInventoryRows(tx, trade.toUserId),
        getPendingGiveCommitments(tx, trade.fromUserId, tradeId),
      ]);

      const fromQty = buildInventoryMap(fromRows);
      const toQty = buildInventoryMap(toRows);

      try {
        validateGiveAvailability(fromQty, trade.giveIds, pendingCommitted);
      } catch {
        throw new ApiError(400, "El proponente ya no tiene todos los repetidos ofrecidos");
      }
      try {
        validateReceiveDoubles(toQty, trade.receiveIds);
      } catch {
        throw new ApiError(400, "Ya no tenés todos los repetidos solicitados");
      }

      trade.giveIds.forEach((id) => {
        fromQty[id] = Math.max(0, Number(fromQty[id] || 0) - 1);
        toQty[id] = Number(toQty[id] || 0) + 1;
      });

      trade.receiveIds.forEach((id) => {
        toQty[id] = Math.max(0, Number(toQty[id] || 0) - 1);
        fromQty[id] = Number(fromQty[id] || 0) + 1;
      });

      const fromNextRows = Object.entries(fromQty)
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([stickerId, quantity]) => ({ userId: trade.fromUserId, stickerId, quantity: Number(quantity) }));
      const toNextRows = Object.entries(toQty)
        .filter(([, quantity]) => Number(quantity) > 0)
        .map(([stickerId, quantity]) => ({ userId: trade.toUserId, stickerId, quantity: Number(quantity) }));

      await tx.userStickerInventory.deleteMany({ where: { userId: trade.fromUserId } });
      await tx.userStickerInventory.deleteMany({ where: { userId: trade.toUserId } });
      if (fromNextRows.length > 0) await tx.userStickerInventory.createMany({ data: fromNextRows });
      if (toNextRows.length > 0) await tx.userStickerInventory.createMany({ data: toNextRows });

      const updated = await tx.tradeProposal.update({
        where: { id: tradeId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });

      return updated;
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "TRADE_ACCEPTED",
      targetType: "trade",
      targetId: out.id,
      details: { from_user_id: out.fromUserId, to_user_id: out.toUserId },
    });

    await awardTradePoints(prisma, out);

    res.json({ id: out.id, status: out.status, responded_at: out.respondedAt });
  } catch (err) {
    next(err);
  }
});

app.post("/api/trades/:id/reject", requireAuth, async (req, res, next) => {
  try {
    const trade = await prisma.tradeProposal.findUnique({ where: { id: req.params.id } });
    if (!trade) throw new ApiError(404, "Trueque no encontrado");
    if (trade.toUserId !== req.authUser.id) throw new ApiError(403, "No autorizado para rechazar este trueque");
    if (trade.status !== "PENDING") throw new ApiError(400, "Este trueque ya fue procesado");
    if (!trade.expiresAt || new Date(trade.expiresAt).getTime() < Date.now()) {
      const expired = await prisma.tradeProposal.update({
        where: { id: req.params.id },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });
      return res.json({ id: expired.id, status: expired.status, responded_at: expired.respondedAt });
    }

    const updated = await prisma.tradeProposal.update({
      where: { id: req.params.id },
      data: { status: "REJECTED", respondedAt: new Date() },
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "TRADE_REJECTED",
      targetType: "trade",
      targetId: updated.id,
    });

    res.json({ id: updated.id, status: updated.status, responded_at: updated.respondedAt });
  } catch (err) {
    next(err);
  }
});

app.post("/api/trades/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    const trade = await prisma.tradeProposal.findUnique({ where: { id: req.params.id } });
    if (!trade) throw new ApiError(404, "Trueque no encontrado");
    if (trade.fromUserId !== req.authUser.id) throw new ApiError(403, "No autorizado para cancelar este trueque");
    if (trade.status !== "PENDING") throw new ApiError(400, "Este trueque ya fue procesado");
    if (!trade.expiresAt || new Date(trade.expiresAt).getTime() < Date.now()) {
      const expired = await prisma.tradeProposal.update({
        where: { id: req.params.id },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });
      return res.json({ id: expired.id, status: expired.status, responded_at: expired.respondedAt });
    }

    const updated = await prisma.tradeProposal.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED", respondedAt: new Date() },
    });

    await writeAuditLog({
      actorId: req.authUser.id,
      action: "TRADE_CANCELLED",
      targetType: "trade",
      targetId: updated.id,
    });

    res.json({ id: updated.id, status: updated.status, responded_at: updated.respondedAt });
  } catch (err) {
    next(err);
  }
});

app.get("/api/profiles", async (req, res, next) => {
  try {
    const ids = splitCsv(req.query.ids);
    const where = {};

    if (ids.length > 0) where.id = { in: ids };
    if (req.query.excludeId) where.id = { ...(where.id || {}), not: String(req.query.excludeId) };

    const blocked = toBool(req.query.blocked);
    if (blocked !== undefined) where.blocked = blocked;

    if (req.query.provincia) where.provincia = String(req.query.provincia);
    if (req.query.canton) where.canton = String(req.query.canton);

    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    const rows = await prisma.profile.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json(rows.map(mapProfileOut));
  } catch (err) {
    next(err);
  }
});

app.get("/api/profiles/by-username/:username", async (req, res, next) => {
  try {
    const username = normalizeUsername(req.params.username);
    const row = await prisma.profile.findUnique({ where: { username } });
    if (!row) return res.status(404).json({ error: "Profile not found" });
    res.json(mapProfileOut(row));
  } catch (err) {
    next(err);
  }
});

app.get("/api/profiles/:id", async (req, res, next) => {
  try {
    const row = await prisma.profile.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Profile not found" });
    res.json(mapProfileOut(row));
  } catch (err) {
    next(err);
  }
});

app.post("/api/profiles", async (req, res, next) => {
  try {
    const row = await prisma.profile.create({ data: mapProfileIn(req.body) });
    res.status(201).json(mapProfileOut(row));
  } catch (err) {
    next(err);
  }
});

app.patch("/api/profiles/:id", requireAuth, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (!req.authUser) throw new ApiError(401, "Unauthorized");
    if (req.authUser.id !== targetId && !req.authUser.isSuperuser) throw new ApiError(403, "No autorizado");

    const data = mapProfileIn(req.body);
    const elevatedFields = ["blocked", "isAdmin", "isSuperuser"];
    const requestedElevated = elevatedFields.some((f) => Object.prototype.hasOwnProperty.call(data, f));
    if (requestedElevated && !req.authUser.isSuperuser) {
      throw new ApiError(403, "Solo superusuario puede actualizar privilegios");
    }

    if (!req.authUser.isSuperuser) {
      delete data.blocked;
      delete data.isAdmin;
      delete data.isSuperuser;
      delete data.passwordHash;
    }

    const row = await prisma.profile.update({ where: { id: targetId }, data });
    if (requestedElevated) {
      await writeAuditLog({
        actorId: req.authUser.id,
        action: "PROFILE_PRIVILEGE_UPDATE",
        targetType: "PROFILE",
        targetId: targetId,
        details: { updated_fields: Object.keys(data) },
      });
    }
    res.json(mapProfileOut(row));
  } catch (err) {
    next(err);
  }
});

app.delete("/api/profiles/:id", requireAuth, requireSuperuser, async (req, res, next) => {
  try {
    if (req.params.id === req.authUser.id) throw new ApiError(400, "No puedes eliminar tu propio superusuario");
    await writeAuditLog({
      actorId: req.authUser.id,
      action: "PROFILE_DELETE",
      targetType: "PROFILE",
      targetId: req.params.id,
      details: null,
    });
    await prisma.profile.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.get("/api/cromos", async (req, res, next) => {
  try {
    const userIds = splitCsv(req.query.userIds);

    const targetUserIds = userIds.length > 0
      ? userIds
      : (await prisma.profile.findMany({ select: { id: true }, orderBy: { createdAt: "desc" } })).map((p) => p.id);

    const result = await prisma.$transaction(async (tx) => {
      const out = [];
      for (const userId of targetUserIds) {
        await syncInventoryFromLegacyIfNeeded(tx, userId);
        const inv = await getUserInventoryRows(tx, userId);
        const { createdAt, updatedAt } = getInventoryTimestamps(inv);
        out.push(mapCromosFromInventory(userId, inv, createdAt, updatedAt));
      }
      return out;
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.get("/api/cromos/:userId", async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: req.params.userId }, select: { id: true } });
    if (!profile) return res.status(404).json({ error: "Not found" });

    const out = await prisma.$transaction(async (tx) => {
      await syncInventoryFromLegacyIfNeeded(tx, req.params.userId);
      const inv = await getUserInventoryRows(tx, req.params.userId);
      const { createdAt, updatedAt } = getInventoryTimestamps(inv);
      return mapCromosFromInventory(req.params.userId, inv, createdAt, updatedAt);
    });
    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.put("/api/cromos/:userId", async (req, res, next) => {
  try {
    const payloadInventory = Array.isArray(req.body.inventory) ? req.body.inventory : [];
    const quantities = req.body.quantities && typeof req.body.quantities === "object" ? req.body.quantities : null;

    const out = await prisma.$transaction(async (tx) => {
      const source = quantities
        ? Object.entries(quantities).map(([stickerId, quantity]) => ({ sticker_id: stickerId, quantity }))
        : payloadInventory;

      const normalized = source
        .map((x) => ({
          stickerId: String(x.sticker_id || x.stickerId || "").trim(),
          quantity: Number(x.quantity || 0),
        }))
        .filter((x) => x.stickerId && Number.isFinite(x.quantity) && x.quantity > 0);

      await tx.userStickerInventory.deleteMany({ where: { userId: req.params.userId } });
      if (normalized.length > 0) {
        await tx.userStickerInventory.createMany({
          data: normalized.map((x) => ({ userId: req.params.userId, stickerId: x.stickerId, quantity: Math.floor(x.quantity) })),
        });
      }
      const inv = await getUserInventoryRows(tx, req.params.userId);
      const { createdAt, updatedAt } = getInventoryTimestamps(inv);
      return mapCromosFromInventory(req.params.userId, inv, createdAt, updatedAt);
    });
    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/cromos/:userId", async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.userStickerInventory.deleteMany({ where: { userId: req.params.userId } });
      await tx.userCromos.deleteMany({ where: { userId: req.params.userId } });
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.get("/api/groups", async (req, res, next) => {
  try {
    const ids = splitCsv(req.query.ids);
    const rows = await prisma.group.findMany({ where: ids.length ? { id: { in: ids } } : {}, orderBy: { createdAt: "desc" } });
    res.json(rows.map(mapGroupOut));
  } catch (err) {
    next(err);
  }
});

app.get("/api/groups/by-code/:code", async (req, res, next) => {
  try {
    const row = await prisma.group.findUnique({ where: { code: req.params.code } });
    if (!row) return res.status(404).json({ error: "Group not found" });
    res.json(mapGroupOut(row));
  } catch (err) {
    next(err);
  }
});

app.post("/api/groups", async (req, res, next) => {
  try {
    const row = await prisma.group.create({ data: mapGroupIn(req.body) });
    res.status(201).json(mapGroupOut(row));
  } catch (err) {
    next(err);
  }
});

app.patch("/api/groups/:id", async (req, res, next) => {
  try {
    const row = await prisma.group.update({ where: { id: req.params.id }, data: mapGroupIn(req.body) });
    res.json(mapGroupOut(row));
  } catch (err) {
    next(err);
  }
});

app.get("/api/conversations", async (req, res, next) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const rows = await prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      orderBy: { lastAt: "desc" },
    });
    res.json(rows.map(mapConversationOut));
  } catch (err) {
    next(err);
  }
});

app.get("/api/conversations/between", async (req, res, next) => {
  try {
    const userA = String(req.query.userA || "");
    const userB = String(req.query.userB || "");
    if (!userA || !userB) return res.status(400).json({ error: "userA and userB are required" });

    const row = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: userA, user2Id: userB },
          { user1Id: userB, user2Id: userA },
        ],
      },
    });

    if (!row) return res.status(404).json({ error: "Conversation not found" });
    res.json(mapConversationOut(row));
  } catch (err) {
    next(err);
  }
});

app.post("/api/conversations", async (req, res, next) => {
  try {
    const row = await prisma.conversation.create({
      data: {
        id: req.body.id,
        user1Id: req.body.user1_id,
        user2Id: req.body.user2_id,
        lastMessage: req.body.last_message || "",
        lastAt: req.body.last_at ? new Date(req.body.last_at) : new Date(),
      },
    });
    res.status(201).json(mapConversationOut(row));
  } catch (err) {
    next(err);
  }
});

app.patch("/api/conversations/:id", async (req, res, next) => {
  try {
    const row = await prisma.conversation.update({
      where: { id: req.params.id },
      data: {
        lastMessage: req.body.last_message,
        lastAt: req.body.last_at ? new Date(req.body.last_at) : undefined,
      },
    });
    res.json(mapConversationOut(row));
  } catch (err) {
    next(err);
  }
});

app.get("/api/messages", async (req, res, next) => {
  try {
    const conversationId = String(req.query.conversationId || "");
    if (!conversationId) return res.status(400).json({ error: "conversationId is required" });

    const rows = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    res.json(rows.map(mapMessageOut));
  } catch (err) {
    next(err);
  }
});

app.post("/api/messages", async (req, res, next) => {
  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          id: req.body.id,
          conversationId: req.body.conversation_id,
          senderId: req.body.sender_id,
          text: req.body.text,
          createdAt: req.body.created_at ? new Date(req.body.created_at) : new Date(),
        },
      });

      await tx.conversation.update({
        where: { id: req.body.conversation_id },
        data: { lastMessage: req.body.text, lastAt: created.createdAt },
      });

      return created;
    });

    res.status(201).json(mapMessageOut(row));
  } catch (err) {
    next(err);
  }
});

registerQuinielaRoutes(app, { prisma, requireAuth, requireSuperuser, writeAuditLog, ApiError });

app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details || null });
  }
  const message = err?.message || "Unexpected error";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`[email] configured=${isEmailConfigured()} mailtrap=${process.env.MAILTRAP_API_TOKEN ? "yes" : "no"} from=${process.env.SMTP_FROM || "(vacío)"}`);
});

if (TRADE_EXPIRY_SWEEP_MS > 0) {
  setInterval(async () => {
    try {
      const changed = await expirePendingTrades();
      if (changed > 0) {
        console.log(`Trade expiry sweep updated ${changed} proposal(s)`);
      }
    } catch (err) {
      console.error("Trade expiry sweep failed", err?.message || err);
    }
  }, TRADE_EXPIRY_SWEEP_MS);
}

if (WEATHER_REFRESH_MS > 0) {
  setInterval(async () => {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || "";
      const result = await refreshAllStadiumWeather(prisma, apiKey);
      console.log(`Weather cache: ${result.refreshed}/${result.total} estadios actualizados`);
    } catch (err) {
      console.error("Weather cache refresh failed", err?.message || err);
    }
  }, WEATHER_REFRESH_MS);
}
