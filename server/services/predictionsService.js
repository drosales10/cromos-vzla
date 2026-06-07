import { buildMatchAnalytics } from "./matchesService.js";
import { getKnockoutPhaseState, isKnockoutPhaseLocked } from "./knockoutPhaseService.js";

const PREDICTION_LOCK_MINUTES = Number(process.env.PREDICTION_LOCK_MINUTES || 15);

export const isPredictionLocked = (kickoffAt, now = new Date()) => {
  const kickoff = new Date(kickoffAt).getTime();
  const lockAt = kickoff - PREDICTION_LOCK_MINUTES * 60 * 1000;
  return now.getTime() >= lockAt;
};

export const mapPredictionOut = (row, match = null) => ({
  id: row.id,
  user_id: row.userId,
  match_id: row.matchId,
  home_goals: row.homeGoals,
  away_goals: row.awayGoals,
  points_earned: row.pointsEarned,
  coins_earned: row.coinsEarned,
  multiplier: Number(row.multiplier),
  special_pack_awarded: row.specialPackAwarded,
  scored_at: row.scoredAt,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
  locked: match ? isPredictionLocked(match.kickoffAt) : undefined,
  match: match || undefined,
});

const SUPERSTAR_SUFFIXES = ["1", "2", "3", "20"];

export const computeCollectionMultiplier = async (prisma, userId, teamSectionId) => {
  if (!teamSectionId) return 1;
  const superstarIds = SUPERSTAR_SUFFIXES.map((n) => `${teamSectionId}${n}`);
  const owned = await prisma.userStickerInventory.findMany({
    where: {
      userId,
      stickerId: { in: superstarIds },
      quantity: { gt: 0 },
    },
  });
  const ownedCount = owned.length;
  if (ownedCount >= 4) return 1.25;
  if (ownedCount >= 2) return 1.15;
  if (ownedCount >= 1) return 1.08;
  return 1;
};

export const upsertPrediction = async (prisma, userId, { match_id, home_goals, away_goals }) => {
  const match = await prisma.match.findUnique({
    where: { id: match_id },
    include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
  });
  if (!match) throw Object.assign(new Error("Partido no encontrado"), { status: 404 });
  if (match.status === "FINISHED") throw Object.assign(new Error("El partido ya finalizó"), { status: 400 });
  if (isPredictionLocked(match.kickoffAt)) {
    throw Object.assign(new Error(`Predicciones bloqueadas ${PREDICTION_LOCK_MINUTES} min antes del pitazo`), { status: 400 });
  }

  if (match.phase !== "GROUP") {
    const knockoutMatches = await prisma.match.findMany({
      where: { phase: { not: "GROUP" } },
      select: { phase: true, status: true, homeScore: true, awayScore: true },
    });
    const knockoutState = getKnockoutPhaseState(knockoutMatches);
    if (isKnockoutPhaseLocked(match.phase, knockoutState)) {
      const label = knockoutState.active_phase_label || "la fase activa";
      throw Object.assign(
        new Error(`Solo podés predecir partidos de ${label}. Esperá a que finalice la fase anterior.`),
        { status: 400 },
      );
    }
  }

  const homeGoals = Number(home_goals);
  const awayGoals = Number(away_goals);
  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) || homeGoals < 0 || awayGoals < 0 || homeGoals > 20 || awayGoals > 20) {
    throw Object.assign(new Error("Marcador inválido (0-20 goles)"), { status: 400 });
  }
  if (match.phase !== "GROUP" && homeGoals === awayGoals) {
    throw Object.assign(new Error("En eliminatorias debés predecir un ganador (no puede haber empate)"), { status: 400 });
  }

  const multiplier = await computeCollectionMultiplier(prisma, userId, match.homeTeam.sectionId);

  const row = await prisma.prediction.upsert({
    where: { userId_matchId: { userId, matchId: match_id } },
    create: {
      userId,
      matchId: match_id,
      homeGoals,
      awayGoals,
      multiplier,
    },
    update: {
      homeGoals,
      awayGoals,
      multiplier,
      scoredAt: null,
      pointsEarned: 0,
      coinsEarned: 0,
      specialPackAwarded: false,
    },
  });

  return mapPredictionOut(row, match);
};

export const getUserPredictions = async (prisma, userId, { matchIds } = {}) => {
  const where = { userId };
  if (matchIds?.length) where.matchId = { in: matchIds };

  const rows = await prisma.prediction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
      },
    },
  });

  return rows.map((r) => mapPredictionOut(r, r.match));
};

export const getMatchAnalysisForUser = async (prisma, matchId, userId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
  });
  if (!match) return null;

  const [prediction, homeMultiplier, awayMultiplier] = await Promise.all([
    prisma.prediction.findUnique({ where: { userId_matchId: { userId, matchId } } }),
    computeCollectionMultiplier(prisma, userId, match.homeTeam.sectionId),
    computeCollectionMultiplier(prisma, userId, match.awayTeam.sectionId),
  ]);

  return {
    match_id: matchId,
    locked: isPredictionLocked(match.kickoffAt),
    lock_minutes: PREDICTION_LOCK_MINUTES,
    analytics: buildMatchAnalytics(match),
    prediction: prediction ? mapPredictionOut(prediction) : null,
    collection_multipliers: {
      home: homeMultiplier,
      away: awayMultiplier,
    },
  };
};
