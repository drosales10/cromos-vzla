import { TBD_TEAM_ID, buildBracketTemplate } from "./bracketService.js";

const SIMULATION_MODEL_HINT = "Reiniciá el servidor API (npm run dev:api) después de ejecutar: npx prisma generate";

export const hasSimulationModel = (prisma) => typeof prisma?.simulationPick?.findMany === "function";

export const findSimulationPicks = async (prisma, userId) => {
  if (!hasSimulationModel(prisma)) {
    console.warn(`simulationPick no disponible en Prisma Client. ${SIMULATION_MODEL_HINT}`);
    return [];
  }
  return prisma.simulationPick.findMany({
    where: { userId },
    orderBy: { bracketSlot: "asc" },
  });
};

export const mapSimulationPickOut = (row) => ({
  bracket_slot: row.bracketSlot,
  predicted_winner_team_id: row.predictedWinnerTeamId,
  predicted_home_goals: row.predictedHomeGoals,
  predicted_away_goals: row.predictedAwayGoals,
  updated_at: row.updatedAt,
});

const teamBriefFromDb = async (prisma, teamId, albumComplete = {}) => {
  if (!teamId || teamId === TBD_TEAM_ID) {
    return { id: TBD_TEAM_ID, name: "Por definir", flag_emoji: "❓", section_id: null, album_complete: false, is_placeholder: true };
  }
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { id: TBD_TEAM_ID, name: "Por definir", flag_emoji: "❓", section_id: null, album_complete: false, is_placeholder: true };
  return {
    id: team.id,
    name: team.name,
    flag_emoji: team.flagEmoji,
    section_id: team.sectionId,
    album_complete: !!albumComplete[team.sectionId],
    is_placeholder: false,
  };
};

const getEffectiveWinner = (node, pickMap) => {
  if (node.has_winner && node.winner_id) return node.winner_id;
  const pick = pickMap.get(node.bracket_slot);
  return pick?.predictedWinnerTeamId || null;
};

export const applySimulationToNodes = async (prisma, nodes, picks, albumComplete = {}) => {
  const pickMap = new Map(picks.map((p) => [p.bracketSlot, p]));
  const nodeMap = new Map(nodes.map((n) => [n.bracket_slot, n]));
  const teamCache = new Map();

  const resolveTeam = async (teamId) => {
    if (!teamId) return teamBriefFromDb(prisma, TBD_TEAM_ID);
    if (teamCache.has(teamId)) return teamCache.get(teamId);
    const t = await teamBriefFromDb(prisma, teamId, albumComplete);
    teamCache.set(teamId, t);
    return t;
  };

  const template = buildBracketTemplate();
  for (const slot of template) {
    const node = nodeMap.get(slot.bracket_slot);
    if (!node) continue;

    let homeId = node.home?.is_placeholder ? null : node.home?.id;
    let awayId = node.away?.is_placeholder ? null : node.away?.id;

    if (slot.feeder_home_slot) {
      const feeder = nodeMap.get(slot.feeder_home_slot);
      const simWinner = feeder ? getEffectiveWinner(feeder, pickMap) : null;
      if (simWinner && simWinner !== TBD_TEAM_ID) homeId = simWinner;
      else if (feeder?.has_winner) homeId = feeder.winner_id;
    }
    if (slot.feeder_away_slot) {
      const feeder = nodeMap.get(slot.feeder_away_slot);
      const simWinner = feeder ? getEffectiveWinner(feeder, pickMap) : null;
      if (simWinner && simWinner !== TBD_TEAM_ID) awayId = simWinner;
      else if (feeder?.has_winner) awayId = feeder.winner_id;
    }

    if (homeId && homeId !== TBD_TEAM_ID) node.home = await resolveTeam(homeId);
    if (awayId && awayId !== TBD_TEAM_ID) node.away = await resolveTeam(awayId);

    const pick = pickMap.get(slot.bracket_slot);
    node.simulation_pick = pick ? {
      predicted_winner_team_id: pick.predictedWinnerTeamId,
      predicted_home_goals: pick.predictedHomeGoals,
      predicted_away_goals: pick.predictedAwayGoals,
    } : null;
  }

  return nodes;
};

export const computeSimulationAccuracy = (nodes, picks) => {
  const pickMap = new Map(picks.map((p) => [p.bracketSlot, p]));
  let evaluated = 0;
  let correct = 0;
  const details = [];

  nodes.forEach((node) => {
    if (!node.has_winner || !node.winner_id) return;
    const pick = pickMap.get(node.bracket_slot);
    if (!pick?.predictedWinnerTeamId) return;
    evaluated += 1;
    const hit = pick.predictedWinnerTeamId === node.winner_id;
    if (hit) correct += 1;
    details.push({
      bracket_slot: node.bracket_slot,
      predicted: pick.predictedWinnerTeamId,
      actual: node.winner_id,
      correct: hit,
    });
  });

  return {
    evaluated,
    correct,
    accuracy_percent: evaluated > 0 ? Math.round((correct / evaluated) * 100) : null,
    picks_total: picks.length,
    details,
  };
};

export const upsertSimulationPick = async (prisma, userId, {
  bracket_slot,
  predicted_winner_team_id,
  predicted_home_goals,
  predicted_away_goals,
}) => {
  const slot = String(bracket_slot || "").trim().toUpperCase();
  const winnerId = String(predicted_winner_team_id || "").trim();
  if (!slot) throw Object.assign(new Error("Slot de bracket requerido"), { status: 400 });
  if (!winnerId) throw Object.assign(new Error("Seleccioná un ganador"), { status: 400 });

  const team = await prisma.team.findUnique({ where: { id: winnerId } });
  if (!team) throw Object.assign(new Error("Selección inválida"), { status: 400 });

  if (!hasSimulationModel(prisma)) {
    throw Object.assign(new Error(`Módulo de simulación no inicializado. ${SIMULATION_MODEL_HINT}`), { status: 503 });
  }

  const row = await prisma.simulationPick.upsert({
    where: { userId_bracketSlot: { userId, bracketSlot: slot } },
    create: {
      userId,
      bracketSlot: slot,
      predictedWinnerTeamId: winnerId,
      predictedHomeGoals: predicted_home_goals ?? null,
      predictedAwayGoals: predicted_away_goals ?? null,
    },
    update: {
      predictedWinnerTeamId: winnerId,
      predictedHomeGoals: predicted_home_goals ?? null,
      predictedAwayGoals: predicted_away_goals ?? null,
    },
  });

  return mapSimulationPickOut(row);
};

export const clearSimulation = async (prisma, userId) => {
  if (!hasSimulationModel(prisma)) {
    return { removed: 0 };
  }
  const removed = await prisma.simulationPick.deleteMany({ where: { userId } });
  return { removed: removed.count };
};
