import { mapTeamOut } from "./matchesService.js";
import { getMatchWinner, TBD_TEAM_ID } from "./bracketService.js";
import { GROUP_CODES } from "../data/worldcup2026-groups.js";
import { computeHybridGroupStandingsForUser, computeRealGroupStandings } from "./groupQualificationService.js";

const KNOCKOUT_PHASES = ["ROUND_32", "ROUND_16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"];

const PHASE_LABELS = {
  GROUP: "Fase de grupos",
  ROUND_32: "Dieciseisavos",
  ROUND_16: "Octavos",
  QUARTER: "Cuartos",
  SEMI: "Semifinal",
  FINAL: "Final",
  THIRD_PLACE: "Tercer puesto",
};

export const buildGroupStandings = async (prisma, { groupCode } = {}) => {
  const { byGroup, meta } = await computeRealGroupStandings(prisma);
  const targetGroups = groupCode
    ? [String(groupCode).trim().toUpperCase()]
    : GROUP_CODES.filter((code) => (byGroup.get(code) || []).length > 0);

  const groups = targetGroups.map((code) => {
    const rows = (byGroup.get(code) || []).map((row, index) => ({
      ...row,
      position: index + 1,
      qualified: index < 2,
    }));
    const m = meta.get(code) || {};

    return {
      group_code: code,
      teams: rows,
      matches_finished: m.matches_finished || 0,
      matches_total: m.matches_total || 0,
    };
  });

  return {
    phase: "GROUP",
    phase_label: PHASE_LABELS.GROUP,
    type: "groups",
    groups,
  };
};

export const buildKnockoutStandings = async (prisma, phase) => {
  const normalized = String(phase || "").trim().toUpperCase();
  if (!KNOCKOUT_PHASES.includes(normalized)) {
    throw Object.assign(new Error("Fase inválida para posiciones de eliminatoria"), { status: 400 });
  }

  const matches = await prisma.match.findMany({
    where: { phase: normalized },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ bracketOrder: "asc" }, { kickoffAt: "asc" }],
  });

  const rows = matches.map((match) => {
    const winnerId = getMatchWinner(match);
    const winnerTeam = winnerId
      ? (winnerId === match.homeTeamId ? match.homeTeam : match.awayTeam)
      : null;

    return {
      bracket_slot: match.bracketSlot,
      kickoff_at: match.kickoffAt,
      status: match.status,
      home_team: mapTeamOut(match.homeTeam),
      away_team: mapTeamOut(match.awayTeam),
      home_score: match.homeScore,
      away_score: match.awayScore,
      winner_team: winnerTeam && winnerTeam.id !== TBD_TEAM_ID ? mapTeamOut(winnerTeam) : null,
    };
  });

  const advanced = rows
    .filter((r) => r.winner_team)
    .map((r) => r.winner_team);

  return {
    phase: normalized,
    phase_label: PHASE_LABELS[normalized] || normalized,
    type: "knockout",
    matches: rows,
    advanced,
    matches_finished: rows.filter((r) => r.status === "FINISHED").length,
    matches_total: rows.length,
  };
};

export const buildPredictedGroupStandings = async (prisma, userId, { groupCode } = {}) => {
  const { byGroup, meta } = await computeHybridGroupStandingsForUser(prisma, userId);

  const targetGroups = groupCode
    ? [String(groupCode).trim().toUpperCase()]
    : GROUP_CODES.filter((code) => (byGroup.get(code) || []).length > 0);

  let predictedCount = 0;
  let realCount = 0;
  GROUP_CODES.forEach((code) => {
    const m = meta.get(code);
    if (m) {
      predictedCount += m.matches_from_prediction;
      realCount += m.matches_from_real;
    }
  });

  const groups = targetGroups.map((code) => {
    const rows = (byGroup.get(code) || []).map((row, index) => ({
      ...row,
      position: index + 1,
      qualified: index < 2,
    }));
    const m = meta.get(code) || {};

    return {
      group_code: code,
      teams: rows,
      matches_finished: m.matches_finished || 0,
      matches_predicted: m.matches_from_prediction || 0,
      matches_counted: (m.matches_from_real || 0) + (m.matches_from_prediction || 0),
      matches_total: m.matches_total || 0,
    };
  });

  return {
    phase: "GROUP",
    phase_label: PHASE_LABELS.GROUP,
    type: "groups",
    mode: "predicted",
    groups,
    summary: {
      from_real: realCount,
      from_predictions: predictedCount,
    },
  };
};

export const getTournamentStandings = async (prisma, { phase = "GROUP", group, mode, userId } = {}) => {
  const normalized = String(phase || "GROUP").trim().toUpperCase();

  if (normalized === "GROUP") {
    if (mode === "predicted") {
      if (!userId) throw Object.assign(new Error("Usuario requerido para posiciones proyectadas"), { status: 401 });
      return buildPredictedGroupStandings(prisma, userId, { groupCode: group });
    }
    return buildGroupStandings(prisma, { groupCode: group });
  }

  return buildKnockoutStandings(prisma, normalized);
};
