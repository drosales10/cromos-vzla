import { mapMatchOut, buildMatchAnalytics } from "./matchesService.js";
import { isPredictionLocked } from "./predictionsService.js";
import { getKnockoutPhaseState } from "./knockoutPhaseService.js";
import { applyPredictionsToNodes, getPredictedChampion } from "./predictionBracketService.js";
import { buildRound32PairingsForUser } from "./groupQualificationService.js";
import { buildOfficialBracketTemplate, buildOfficialKnockoutMatches } from "../data/worldcup2026-knockout-schedule.js";

export const TBD_TEAM_ID = "TBD";
export const STICKERS_PER_SECTION = 20;
export const ALBUM_COMPLETE_THRESHOLD = 15;

export const BRACKET_ROUNDS = [
  { phase: "ROUND_32", prefix: "R32", label: "Dieciseisavos", count: 16 },
  { phase: "ROUND_16", prefix: "R16", label: "Octavos", count: 8 },
  { phase: "QUARTER", prefix: "QF", label: "Cuartos", count: 4 },
  { phase: "SEMI", prefix: "SF", label: "Semifinal", count: 2 },
  { phase: "THIRD_PLACE", prefix: "THIRD_PLACE", label: "Tercer puesto", count: 1 },
  { phase: "FINAL", prefix: "FINAL", label: "Final", count: 1 },
];

export const buildBracketTemplate = () => buildOfficialBracketTemplate();

export const getMatchWinner = (match) => {
  if (match.status !== "FINISHED" || match.homeScore == null || match.awayScore == null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeamId;
  if (match.awayScore > match.homeScore) return match.awayTeamId;
  return null;
};

export const getMatchWinnerTeam = (match) => {
  const winnerId = getMatchWinner(match);
  if (!winnerId) return null;
  if (winnerId === match.homeTeamId) return match.homeTeam;
  return match.awayTeam;
};

const mapTeamBrief = (team, albumComplete = false) => {
  if (!team || team.id === TBD_TEAM_ID) {
    return { id: TBD_TEAM_ID, name: "Por definir", flag_emoji: "❓", section_id: null, album_complete: false, is_placeholder: true };
  }
  return {
    id: team.id,
    name: team.name,
    flag_emoji: team.flagEmoji,
    section_id: team.sectionId,
    album_complete: albumComplete,
    is_placeholder: false,
  };
};

export const computeAlbumCompletion = async (prisma, userId) => {
  const rows = await prisma.userStickerInventory.findMany({
    where: { userId, quantity: { gt: 0 } },
    include: { sticker: { select: { section: true } } },
  });

  const bySection = {};
  rows.forEach((r) => {
    const sec = r.sticker?.section;
    if (!sec || sec === "FWC" || sec === "CC") return;
    bySection[sec] = (bySection[sec] || 0) + Number(r.quantity || 0);
  });

  const complete = {};
  Object.entries(bySection).forEach(([section, count]) => {
    complete[section] = count >= ALBUM_COMPLETE_THRESHOLD;
  });
  return complete;
};

export const propagateBracketWinner = async (prisma, finishedMatch) => {
  if (!finishedMatch.bracketSlot) return [];
  const winner = getMatchWinnerTeam(finishedMatch);
  if (!winner || winner.id === TBD_TEAM_ID) return [];

  const downstream = await prisma.match.findMany({
    where: {
      OR: [
        { feederHomeSlot: finishedMatch.bracketSlot },
        { feederAwaySlot: finishedMatch.bracketSlot },
      ],
    },
  });

  const updated = [];
  for (const next of downstream) {
    const data = {};
    if (next.feederHomeSlot === finishedMatch.bracketSlot) data.homeTeamId = winner.id;
    if (next.feederAwaySlot === finishedMatch.bracketSlot) data.awayTeamId = winner.id;
    if (Object.keys(data).length > 0) {
      await prisma.match.update({ where: { id: next.id }, data });
      updated.push({ match_id: next.id, bracket_slot: next.bracketSlot, ...data });
    }
  }
  return updated;
};

export const normalizeBracketViewMode = (mode) => (mode === "real" ? "real" : "predicted");

const buildRoundsFromNodes = (nodes) => (
  BRACKET_ROUNDS.map((round, roundIndex) => ({
    phase: round.phase,
    label: round.label,
    round_index: roundIndex,
    nodes: nodes.filter((n) => n.phase === round.phase),
  }))
);

const getChampionFromNodes = (nodes) => {
  const finalNode = nodes.find((n) => n.bracket_slot === "FINAL" && n.has_winner);
  if (!finalNode?.winner_id) return null;
  return finalNode.winner_id === finalNode.home?.id ? finalNode.home : finalNode.away;
};

const resolveDbTeam = async (prisma, teamId, albumComplete, cache) => {
  if (!teamId || teamId === TBD_TEAM_ID) return mapTeamBrief(null);
  if (cache.has(teamId)) return cache.get(teamId);
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  const brief = mapTeamBrief(team, albumComplete[team?.sectionId]);
  cache.set(teamId, brief);
  return brief;
};

const assembleBracketForViewMode = async (prisma, userId, context, viewMode) => {
  const { template, albumComplete, dbMatches, predByMatch, bySlot, knockoutState } = context;
  const isReal = viewMode === "real";

  const nodes = template.map((slot) => {
    const match = bySlot.get(slot.bracket_slot) || null;
    const prediction = match ? predByMatch.get(match.id) : null;
    const finished = match?.status === "FINISHED";

    const isRound32 = slot.phase === "ROUND_32";
    let home = mapTeamBrief(null);
    let away = mapTeamBrief(null);
    if (finished) {
      home = mapTeamBrief(match.homeTeam, albumComplete[match.homeTeam?.sectionId]);
      away = mapTeamBrief(match.awayTeam, albumComplete[match.awayTeam?.sectionId]);
    } else if (!isRound32 && !isReal && match) {
      home = mapTeamBrief(match.homeTeam, albumComplete[match.homeTeam?.sectionId]);
      away = mapTeamBrief(match.awayTeam, albumComplete[match.awayTeam?.sectionId]);
    }

    const winnerId = match ? getMatchWinner(match) : null;
    const kickoffLocked = match ? isPredictionLocked(match.kickoffAt) : true;

    return {
      bracket_slot: slot.bracket_slot,
      phase: slot.phase,
      round_index: slot.round_index,
      match_index: slot.match_index,
      feeder_home_slot: slot.feeder_home_slot,
      feeder_away_slot: slot.feeder_away_slot,
      label: slot.label,
      match_id: match?.id || null,
      status: match?.status || "SCHEDULED",
      kickoff_at: match?.kickoffAt || null,
      home_score: match?.homeScore ?? null,
      away_score: match?.awayScore ?? null,
      home,
      away,
      winner_id: winnerId,
      has_winner: !!winnerId,
      locked: match
        ? match.status === "FINISHED" || kickoffLocked
        : true,
      kickoff_locked: kickoffLocked,
      prediction: prediction ? {
        home_goals: prediction.homeGoals,
        away_goals: prediction.awayGoals,
        points_earned: prediction.pointsEarned,
      } : null,
      analytics: match ? buildMatchAnalytics(match) : null,
      view_mode: viewMode,
    };
  });

  const { pairings: r32Pairings } = await buildRound32PairingsForUser(prisma, userId, { mode: viewMode });
  const r32BySlot = new Map(r32Pairings.map((p) => [p.bracket_slot, p]));
  const teamCache = new Map();

  for (const node of nodes) {
    if (node.phase !== "ROUND_32") continue;

    const match = bySlot.get(node.bracket_slot);
    if (match?.status === "FINISHED") continue;

    const pairing = r32BySlot.get(node.bracket_slot);
    if (!pairing) {
      node.home = mapTeamBrief(null);
      node.away = mapTeamBrief(null);
      continue;
    }

    node.home = await resolveDbTeam(prisma, pairing.home_team_id, albumComplete, teamCache);
    node.away = await resolveDbTeam(prisma, pairing.away_team_id, albumComplete, teamCache);
    node.from_group_standings = true;
    node.qualifier_source = isReal ? "real" : "predicted";
    node.home_group = pairing.home_group;
    node.away_group = pairing.away_group;
  }

  const nodeMap = new Map(nodes.map((n) => [n.bracket_slot, n]));
  nodes.forEach((node) => {
    if (!node.match_id || node.has_winner) return;

    if (node.feeder_home_slot) {
      const feeder = nodeMap.get(node.feeder_home_slot);
      if (feeder?.has_winner) {
        const w = feeder.winner_id === feeder.home.id ? feeder.home : feeder.away;
        node.home = { ...w, album_complete: albumComplete[w.section_id] || false, is_placeholder: false };
      }
    }
    if (node.feeder_away_slot) {
      const feeder = nodeMap.get(node.feeder_away_slot);
      if (feeder?.has_winner) {
        const w = feeder.winner_id === feeder.home.id ? feeder.home : feeder.away;
        node.away = { ...w, album_complete: albumComplete[w.section_id] || false, is_placeholder: false };
      }
    }
  });

  await applyPredictionsToNodes(prisma, nodes, knockoutState, albumComplete, viewMode);

  return nodes;
};

export const buildTournamentBracket = async (prisma, userId) => {
  const template = buildBracketTemplate();
  const albumComplete = await computeAlbumCompletion(prisma, userId);

  const dbMatches = await prisma.match.findMany({
    where: { phase: { not: "GROUP" } },
    include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
    orderBy: [{ phase: "asc" }, { bracketOrder: "asc" }, { kickoffAt: "asc" }],
  });

  const predictions = await prisma.prediction.findMany({
    where: { userId, matchId: { in: dbMatches.map((m) => m.id) } },
  });

  const context = {
    template,
    albumComplete,
    dbMatches,
    predByMatch: new Map(predictions.map((p) => [p.matchId, p])),
    bySlot: new Map(dbMatches.filter((m) => m.bracketSlot).map((m) => [m.bracketSlot, m])),
    knockoutState: getKnockoutPhaseState(dbMatches),
  };

  const [realNodes, predictedNodes] = await Promise.all([
    assembleBracketForViewMode(prisma, userId, context, "real"),
    assembleBracketForViewMode(prisma, userId, context, "predicted"),
  ]);

  const predictedChampion = await getPredictedChampion(prisma, predictedNodes);

  const nodesByMode = {
    real: realNodes,
    predicted: predictedNodes,
  };

  const roundsByMode = {
    real: buildRoundsFromNodes(realNodes),
    predicted: buildRoundsFromNodes(predictedNodes),
  };

  return {
    nodes_by_mode: nodesByMode,
    rounds_by_mode: roundsByMode,
    nodes: predictedNodes,
    rounds: roundsByMode.predicted,
    champion: getChampionFromNodes(realNodes),
    predicted_champion: predictedChampion,
    knockout_state: context.knockoutState,
    album_sections_complete: albumComplete,
  };
};

export const seedGroupStageMatches = async (prisma, { replace = false, syncSchedule = true } = {}) => {
  const { buildAllGroupMatches } = await import("../data/worldcup2026-groups.js");

  if (replace) {
    await prisma.match.deleteMany({ where: { phase: "GROUP" } });
  }

  const allMatches = buildAllGroupMatches();
  const officialKeys = new Set(
    allMatches.map((m) => `${m.group}|${m.home}|${m.away}`),
  );
  const created = [];
  const updated = [];

  for (const m of allMatches) {
    const dup = await prisma.match.findFirst({
      where: {
        phase: "GROUP",
        groupCode: m.group,
        homeTeamId: m.home,
        awayTeamId: m.away,
      },
    });

    if (dup) {
      if (syncSchedule) {
        await prisma.match.update({
          where: { id: dup.id },
          data: {
            homeTeamId: m.home,
            awayTeamId: m.away,
            stadiumId: m.stadium,
            kickoffAt: m.kickoff,
            bracketOrder: m.match_order,
            groupCode: m.group,
          },
        });
        updated.push(dup.id);
      }
      continue;
    }

    const row = await prisma.match.create({
      data: {
        homeTeamId: m.home,
        awayTeamId: m.away,
        stadiumId: m.stadium,
        kickoffAt: m.kickoff,
        phase: "GROUP",
        groupCode: m.group,
        bracketOrder: m.match_order,
        status: "SCHEDULED",
      },
    });
    created.push(row.id);
  }

  const stale = await prisma.match.findMany({
    where: { phase: "GROUP" },
    select: { id: true, groupCode: true, homeTeamId: true, awayTeamId: true },
  });
  const staleIds = stale
    .filter((m) => !officialKeys.has(`${m.groupCode}|${m.homeTeamId}|${m.awayTeamId}`))
    .map((m) => m.id);

  if (staleIds.length > 0) {
    await prisma.prediction.deleteMany({ where: { matchId: { in: staleIds } } });
    await prisma.match.deleteMany({ where: { id: { in: staleIds } } });
  }

  const existing = await prisma.match.count({ where: { phase: "GROUP" } });

  return {
    created_count: created.length,
    updated_count: updated.length,
    removed_count: staleIds.length,
    total: 72,
    existing,
    skipped: !replace && created.length === 0 && updated.length === 0 && staleIds.length === 0 && existing >= 72,
  };
};

export const mapBracketNodeForClient = (node) => node;

export const ensureTbdTeam = async (prisma) => prisma.team.upsert({
  where: { id: TBD_TEAM_ID },
  create: {
    id: TBD_TEAM_ID,
    name: "Por definir",
    country: "TBD",
    flagEmoji: "❓",
    sectionId: null,
  },
  update: { name: "Por definir", flagEmoji: "❓" },
});

export const generateBracketMatches = async (prisma, {
  replace = false,
  syncSchedule = true,
  syncWeather = false,
  weatherApiKey = "",
} = {}) => {
  await ensureTbdTeam(prisma);

  const template = buildBracketTemplate();
  const templateBySlot = new Map(template.map((s) => [s.bracket_slot, s]));
  const officialMatches = buildOfficialKnockoutMatches();
  const totalSlots = officialMatches.length;

  let deleted = 0;
  if (replace) {
    const removed = await prisma.match.deleteMany({
      where: { phase: { not: "GROUP" }, bracketSlot: { not: null } },
    });
    deleted = removed.count;
  }

  const created = [];
  const updated = [];
  const skipped = [];

  for (const fixture of officialMatches) {
    const slotMeta = templateBySlot.get(fixture.bracket_slot) || {};
    const existing = await prisma.match.findFirst({
      where: { bracketSlot: fixture.bracket_slot },
    });

    const data = {
      homeTeamId: TBD_TEAM_ID,
      awayTeamId: TBD_TEAM_ID,
      stadiumId: fixture.stadium,
      kickoffAt: fixture.kickoff,
      phase: fixture.phase,
      status: "SCHEDULED",
      bracketSlot: fixture.bracket_slot,
      feederHomeSlot: slotMeta.feeder_home_slot || fixture.feeder_home_slot || null,
      feederAwaySlot: slotMeta.feeder_away_slot || fixture.feeder_away_slot || null,
      bracketOrder: fixture.bracket_order ?? fixture.match_number,
    };

    if (existing) {
      if (syncSchedule) {
        await prisma.match.update({
          where: { id: existing.id },
          data: {
            stadiumId: data.stadiumId,
            kickoffAt: data.kickoffAt,
            phase: data.phase,
            feederHomeSlot: data.feederHomeSlot,
            feederAwaySlot: data.feederAwaySlot,
            bracketOrder: data.bracketOrder,
          },
        });
        updated.push({ id: existing.id, bracket_slot: fixture.bracket_slot, phase: fixture.phase });
      } else {
        skipped.push(fixture.bracket_slot);
      }
      continue;
    }

    const row = await prisma.match.create({ data });
    created.push({ id: row.id, bracket_slot: fixture.bracket_slot, phase: fixture.phase });
  }

  if (syncWeather && weatherApiKey) {
    const { syncMatchWeather } = await import("./matchesService.js");
    for (const item of [...created, ...updated]) {
      await syncMatchWeather(prisma, item.id, weatherApiKey).catch(() => {});
    }
  }

  return {
    total_slots: totalSlots,
    created_count: created.length,
    updated_count: updated.length,
    skipped_count: skipped.length,
    deleted_count: deleted,
    created,
    updated,
    skipped,
  };
};

export const seedRound32SimulationTeams = async (prisma, { resetResults = true } = {}) => {
  const { buildRound32SimulationPairings } = await import("../data/worldcup2026-groups.js");

  await ensureTbdTeam(prisma);

  const pairings = buildRound32SimulationPairings();
  const updated = [];
  const missing = [];

  for (const pairing of pairings) {
    const match = await prisma.match.findFirst({
      where: { bracketSlot: pairing.bracket_slot, phase: "ROUND_32" },
    });
    if (!match) {
      missing.push(pairing.bracket_slot);
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeTeamId: pairing.home,
        awayTeamId: pairing.away,
        ...(resetResults ? {
          status: "SCHEDULED",
          homeScore: null,
          awayScore: null,
        } : {}),
      },
    });
    updated.push({
      bracket_slot: pairing.bracket_slot,
      home: pairing.home,
      away: pairing.away,
    });
  }

  if (resetResults && updated.length > 0) {
    await prisma.match.updateMany({
      where: {
        phase: { in: ["ROUND_16", "QUARTER", "SEMI", "FINAL", "THIRD_PLACE"] },
        bracketSlot: { not: null },
      },
      data: {
        homeTeamId: TBD_TEAM_ID,
        awayTeamId: TBD_TEAM_ID,
        status: "SCHEDULED",
        homeScore: null,
        awayScore: null,
      },
    });
  }

  return {
    updated_count: updated.length,
    total_slots: 16,
    teams_seeded: updated.length * 2,
    missing_slots: missing,
    pairings: updated,
  };
};
