import { buildMatchAnalytics } from "./matchesService.js";
import { propagateBracketWinner } from "./bracketService.js";

const POINTS_BASIC = Number(process.env.QUINIELA_POINTS_BASIC || 10);
const POINTS_PARTIAL = Number(process.env.QUINIELA_POINTS_PARTIAL || 5);
const POINTS_EXACT = Number(process.env.QUINIELA_POINTS_EXACT || 25);
const COINS_PER_POINT = Number(process.env.QUINIELA_COINS_PER_POINT || 2);
const EXACT_SCORE_BONUS_COINS = Number(process.env.QUINIELA_EXACT_BONUS_COINS || 100);
const SPECIAL_PACK_TYPE_ID = process.env.SPECIAL_PACK_TYPE_ID || "STD5";
const TRADE_POINTS = Number(process.env.TRADE_POINTS_PER_SWAP || 5);
const MAX_TRADE_POINTS_DAY = Number(process.env.MAX_TRADE_POINTS_PER_DAY || 3);

export const computePredictionPoints = (prediction, actualHome, actualAway) => {
  const predHome = prediction.homeGoals;
  const predAway = prediction.awayGoals;

  const exact = predHome === actualHome && predAway === actualAway;
  if (exact) {
    return { points: POINTS_EXACT, exact: true, basic: true, partial: true };
  }

  const predResult = Math.sign(predHome - predAway);
  const actualResult = Math.sign(actualHome - actualAway);
  const basic = predResult === actualResult;

  const partial = predHome === actualHome || predAway === actualAway;

  let points = 0;
  if (basic) points += POINTS_BASIC;
  if (partial) points += POINTS_PARTIAL;

  return { points, exact: false, basic, partial };
};

const isUpsetWin = (actualHome, actualAway, analytics) => {
  const homeWon = actualHome > actualAway;
  const awayWon = actualAway > actualHome;
  if (!homeWon && !awayWon) return false;

  const winnerSide = homeWon ? "home" : "away";
  const winnerAnalytics = analytics[winnerSide];
  const loserAnalytics = analytics[winnerSide === "home" ? "away" : "home"];

  return winnerAnalytics.climate_comfort < 45
    || winnerAnalytics.fatigue_index >= 35
    || winnerAnalytics.squad_power + 15 < loserAnalytics.squad_power;
};

export const scoreMatchPredictions = async (prisma, matchId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
  });
  if (!match) throw Object.assign(new Error("Partido no encontrado"), { status: 404 });
  if (match.status !== "FINISHED") throw Object.assign(new Error("El partido no está finalizado"), { status: 400 });
  if (match.homeScore == null || match.awayScore == null) {
    throw Object.assign(new Error("Faltan goles reales del partido"), { status: 400 });
  }
  if (match.predictionsScoredAt) {
    return { already_scored: true, match_id: matchId };
  }

  const predictions = await prisma.prediction.findMany({
    where: { matchId, scoredAt: null },
  });

  const analytics = buildMatchAnalytics(match);
  const upset = isUpsetWin(match.homeScore, match.awayScore, analytics);

  const results = await prisma.$transaction(async (tx) => {
    const scored = [];

    for (const pred of predictions) {
      const { points, exact } = computePredictionPoints(pred, match.homeScore, match.awayScore);
      const multiplier = Number(pred.multiplier || 1);
      const finalPoints = Math.round(points * multiplier);
      let coins = finalPoints * COINS_PER_POINT;
      if (exact) coins += EXACT_SCORE_BONUS_COINS;

      let specialPackAwarded = false;
      if (upset && exact) {
        const packInv = await tx.userPackInventory.findUnique({
          where: { userId_packTypeId: { userId: pred.userId, packTypeId: SPECIAL_PACK_TYPE_ID } },
        });
        if (packInv) {
          await tx.userPackInventory.update({
            where: { userId_packTypeId: { userId: pred.userId, packTypeId: SPECIAL_PACK_TYPE_ID } },
            data: { quantity: { increment: 1 } },
          });
        } else {
          await tx.userPackInventory.create({
            data: { userId: pred.userId, packTypeId: SPECIAL_PACK_TYPE_ID, quantity: 1 },
          });
        }
        specialPackAwarded = true;
      }

      if (coins > 0) {
        const wallet = await tx.userWallet.findUnique({ where: { userId: pred.userId } });
        const balance = Number(wallet?.coins || 0) + coins;
        await tx.userWallet.upsert({
          where: { userId: pred.userId },
          create: { userId: pred.userId, coins: balance },
          update: { coins: balance },
        });
        await tx.walletLedger.create({
          data: {
            userId: pred.userId,
            entryType: "QUINIELA_REWARD",
            amount: coins,
            balanceAfter: balance,
            reason: `Quiniela partido ${matchId}`,
            metadata: { match_id: matchId, points: finalPoints, exact },
          },
        });
      }

      await tx.prediction.update({
        where: { id: pred.id },
        data: {
          pointsEarned: finalPoints,
          coinsEarned: coins,
          specialPackAwarded,
          scoredAt: new Date(),
        },
      });

      await tx.userGameScore.upsert({
        where: { userId: pred.userId },
        create: { userId: pred.userId, quinielaPoints: finalPoints },
        update: { quinielaPoints: { increment: finalPoints } },
      });

      scored.push({ user_id: pred.userId, points: finalPoints, coins, exact, special_pack: specialPackAwarded });
    }

    await tx.match.update({
      where: { id: matchId },
      data: { predictionsScoredAt: new Date() },
    });

    return scored;
  });

  const finishedMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });
  const propagated = await propagateBracketWinner(prisma, finishedMatch);

  return { match_id: matchId, scored_count: results.length, results, propagated };
};

const canAwardTradePoints = async (prisma, userId, trade) => {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.tradeScoreEntry.count({
    where: { userId, createdAt: { gte: dayStart } },
  });
  if (todayCount >= MAX_TRADE_POINTS_DAY) return false;

  const recentPair = await prisma.tradeProposal.count({
    where: {
      status: "ACCEPTED",
      id: { not: trade.id },
      OR: [
        { fromUserId: trade.fromUserId, toUserId: trade.toUserId },
        { fromUserId: trade.toUserId, toUserId: trade.fromUserId },
      ],
      respondedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recentPair >= 2) return false;

  const existing = await prisma.tradeScoreEntry.findUnique({
    where: { tradeId_userId: { tradeId: trade.id, userId } },
  });
  return !existing;
};

export const awardTradePoints = async (prisma, trade) => {
  const awarded = [];

  for (const userId of [trade.fromUserId, trade.toUserId]) {
    if (!(await canAwardTradePoints(prisma, userId, trade))) continue;

    await prisma.$transaction(async (tx) => {
      await tx.tradeScoreEntry.create({
        data: { userId, tradeId: trade.id, points: TRADE_POINTS },
      });
      await tx.userGameScore.upsert({
        where: { userId },
        create: { userId, tradePoints: TRADE_POINTS },
        update: { tradePoints: { increment: TRADE_POINTS } },
      });
    });
    awarded.push({ user_id: userId, points: TRADE_POINTS });
  }

  return awarded.length > 0 ? { awarded } : null;
};

export const syncAlbumPoints = async (prisma, userId) => {
  const rows = await prisma.userStickerInventory.findMany({
    where: { userId, quantity: { gt: 0 } },
  });
  const albumPoints = rows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  await prisma.userGameScore.upsert({
    where: { userId },
    create: { userId, albumPoints },
    update: { albumPoints },
  });
  return albumPoints;
};

export const getLeaderboard = async (prisma, { leagueId, limit = 50 } = {}) => {
  let userIds = null;
  if (leagueId) {
    const members = await prisma.privateLeagueMember.findMany({ where: { leagueId } });
    userIds = members.map((m) => m.userId);
    if (userIds.length === 0) return [];
  }

  const scores = await prisma.userGameScore.findMany({
    where: userIds ? { userId: { in: userIds } } : undefined,
    include: { user: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    take: limit,
  });

  return scores
    .map((s) => ({
      user_id: s.userId,
      username: s.user.username,
      name: s.user.name,
      avatar_url: s.user.avatarUrl,
      album_points: s.albumPoints,
      trade_points: s.tradePoints,
      quiniela_points: s.quinielaPoints,
      total_points: s.albumPoints + s.tradePoints + s.quinielaPoints,
    }))
    .sort((a, b) => b.total_points - a.total_points);
};
