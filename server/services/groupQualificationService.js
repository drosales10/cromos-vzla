import { mapTeamOut } from "./matchesService.js";
import {
  GROUP_CODES,
  buildGroupAssignments,
  getOfficialGroupTeams,
  officialSeedIndex,
} from "../data/worldcup2026-groups.js";
import { OFFICIAL_R32_FIXTURES } from "../data/worldcup2026-knockout-schedule.js";
import {
  assignThirdPlacesAnnexC,
  rankThirdPlaceCandidates,
  R32_THIRD_WINNER_SLOTS,
} from "../data/worldcup2026-annex-c.js";

export const TBD_TEAM_ID = "TBD";

const GROUP_SEEDS = buildGroupAssignments();

const seedIndex = (groupCode, teamId) => officialSeedIndex(groupCode, teamId);

/** Desempate con semilla del sorteo (predicciones / híbrido). */
const compareGroupRows = (a, b, groupCode) => {
  if (a.played === 0 && b.played > 0) return 1;
  if (b.played === 0 && a.played > 0) return -1;
  if (b.points !== a.points) return b.points - a.points;
  if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return seedIndex(groupCode, a.team_id) - seedIndex(groupCode, b.team_id);
};

/** Desempate tabla real: puntos y luego orden del sorteo FIFA (no alfabético). */
const compareGroupRowsReal = (a, b, groupCode) => {
  if (a.played === 0 && b.played > 0) return 1;
  if (b.played === 0 && a.played > 0) return -1;
  if (b.points !== a.points) return b.points - a.points;
  if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return seedIndex(groupCode, a.team_id) - seedIndex(groupCode, b.team_id);
};

const sortGroupRowsReal = (teamsMap, groupCode) => (
  [...teamsMap.values()].sort((a, b) => compareGroupRowsReal(a, b, groupCode)).map((row, index) => ({
    ...row,
    position: index + 1,
  }))
);

/** Asegura las 4 selecciones del sorteo FIFA aunque falten en partidos cargados. */
const ensureOfficialGroupTeams = (teamsMap, groupCode, groupMatches) => {
  getOfficialGroupTeams(groupCode).forEach((teamId) => {
    if (teamsMap.has(teamId)) return;
    const team = groupMatches.find((m) => m.homeTeamId === teamId)?.homeTeam
      || groupMatches.find((m) => m.awayTeamId === teamId)?.awayTeam;
    if (team) {
      teamsMap.set(teamId, initTeamRow(team));
    }
  });
};

const initTeamRow = (team) => ({
  team_id: team.id,
  team: mapTeamOut(team),
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goals_for: 0,
  goals_against: 0,
  goal_diff: 0,
  points: 0,
});

const applyResult = (row, goalsFor, goalsAgainst) => {
  row.played += 1;
  row.goals_for += goalsFor;
  row.goals_against += goalsAgainst;
  row.goal_diff = row.goals_for - row.goals_against;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor < goalsAgainst) {
    row.lost += 1;
  } else {
    row.drawn += 1;
    row.points += 1;
  }
};

const buildTeamsMap = (groupMatches) => {
  const teamsMap = new Map();
  groupMatches.forEach((match) => {
    [match.homeTeam, match.awayTeam].forEach((team) => {
      if (!team || team.id === TBD_TEAM_ID) return;
      if (!teamsMap.has(team.id)) teamsMap.set(team.id, initTeamRow(team));
    });
  });
  return teamsMap;
};

const isGroupCompleteReal = (groupMatches) => (
  groupMatches.length > 0
  && groupMatches.every((m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null)
);

const accumulateStandings = (teamsMap, groupMatches, scoreResolver) => {
  let fromReal = 0;
  let fromPrediction = 0;

  groupMatches.forEach((match) => {
    const scores = scoreResolver(match);
    if (!scores) return;

    const { homeGoals, awayGoals, source } = scores;
    const homeRow = teamsMap.get(match.homeTeamId);
    const awayRow = teamsMap.get(match.awayTeamId);
    if (!homeRow || !awayRow) return;

    applyResult(homeRow, homeGoals, awayGoals);
    applyResult(awayRow, awayGoals, homeGoals);

    if (source === "real") fromReal += 1;
    if (source === "prediction") fromPrediction += 1;
  });

  return { fromReal, fromPrediction };
};

const sortGroupRows = (teamsMap, groupCode) => (
  [...teamsMap.values()].sort((a, b) => compareGroupRows(a, b, groupCode)).map((row, index) => ({
    ...row,
    position: index + 1,
  }))
);

const fallbackRowsForGroup = (groupCode) => {
  const seeds = GROUP_SEEDS[groupCode] || [];
  return seeds.slice(0, 4).map((teamId, index) => ({
    team_id: teamId,
    team: { id: teamId, name: teamId, flag_emoji: "🏳️" },
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    points: 0,
    position: index + 1,
    is_seed_fallback: true,
  }));
};

/**
 * Por grupo:
 * - Si los 6 partidos finalizaron en la vida real → tabla 100% real (ignora predicciones).
 * - Si no → tabla híbrida: partido finalizado = real; pendiente con predicción = predicción.
 * - Sin datos contados → orden de semilla del grupo (MEX 1°, RSA 2°, etc.).
 */
export const computeHybridGroupStandingsForUser = async (prisma, userId) => {
  const matches = await prisma.match.findMany({
    where: { phase: "GROUP" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ groupCode: "asc" }, { kickoffAt: "asc" }],
  });

  const predictions = await prisma.prediction.findMany({
    where: {
      userId,
      matchId: { in: matches.map((m) => m.id) },
    },
  });
  const predByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  const byGroup = new Map();
  const meta = new Map();

  GROUP_CODES.forEach((code) => {
    const groupMatches = matches.filter((m) => m.groupCode === code);
    const teamsMap = buildTeamsMap(groupMatches);
    const completeReal = isGroupCompleteReal(groupMatches);

    let fromReal = 0;
    let fromPrediction = 0;

    if (groupMatches.length > 0) {
      if (completeReal) {
        ({ fromReal } = accumulateStandings(teamsMap, groupMatches, (match) => ({
          homeGoals: match.homeScore,
          awayGoals: match.awayScore,
          source: "real",
        })));
      } else {
        ({ fromReal, fromPrediction } = accumulateStandings(teamsMap, groupMatches, (match) => {
          if (match.status === "FINISHED" && match.homeScore != null && match.awayScore != null) {
            return { homeGoals: match.homeScore, awayGoals: match.awayScore, source: "real" };
          }
          const pred = predByMatch.get(match.id);
          if (pred) {
            return { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals, source: "prediction" };
          }
          return null;
        }));
      }
    }

    ensureOfficialGroupTeams(teamsMap, code, groupMatches);
    let rows = sortGroupRows(teamsMap, code);
    const hasCountedMatches = fromReal + fromPrediction > 0;

    meta.set(code, {
      matches_total: groupMatches.length,
      matches_finished: groupMatches.filter((m) => m.status === "FINISHED").length,
      matches_from_real: fromReal,
      matches_from_prediction: fromPrediction,
      source: completeReal ? "real" : (hasCountedMatches ? "predicted" : "seed"),
      is_complete_real: completeReal,
    });

    if (!hasCountedMatches && !completeReal) {
      rows = fallbackRowsForGroup(code).map((row, index) => {
        const team = groupMatches.find((m) => m.homeTeamId === row.team_id)?.homeTeam
          || groupMatches.find((m) => m.awayTeamId === row.team_id)?.awayTeam;
        return {
          ...row,
          team: team ? mapTeamOut(team) : row.team,
          position: index + 1,
        };
      });
    }

    byGroup.set(code, rows);
  });

  return { byGroup, meta };
};

/** Solo partidos finalizados en la vida real (sin predicciones). */
export const computeRealGroupStandings = async (prisma) => {
  const matches = await prisma.match.findMany({
    where: { phase: "GROUP" },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ groupCode: "asc" }, { kickoffAt: "asc" }],
  });

  const byGroup = new Map();
  const meta = new Map();

  GROUP_CODES.forEach((code) => {
    const groupMatches = matches.filter((m) => m.groupCode === code);
    const teamsMap = buildTeamsMap(groupMatches);
    const completeReal = isGroupCompleteReal(groupMatches);

    const { fromReal } = accumulateStandings(teamsMap, groupMatches, (match) => {
      if (match.status === "FINISHED" && match.homeScore != null && match.awayScore != null) {
        return { homeGoals: match.homeScore, awayGoals: match.awayScore, source: "real" };
      }
      return null;
    });

    ensureOfficialGroupTeams(teamsMap, code, groupMatches);
    const rows = sortGroupRowsReal(teamsMap, code);
    const hasFixtures = groupMatches.length > 0;
    const hasReal = fromReal > 0;

    meta.set(code, {
      matches_total: groupMatches.length,
      matches_finished: groupMatches.filter((m) => m.status === "FINISHED").length,
      matches_from_real: fromReal,
      matches_from_prediction: 0,
      source: completeReal ? "real" : (hasReal ? "partial" : "pending"),
      is_complete_real: completeReal,
      has_real_data: hasFixtures,
    });

    byGroup.set(code, rows);
  });

  return { byGroup, meta };
};

const pickQualifier = (rows, placeIndex, groupCode) => {
  const row = rows?.[placeIndex];
  if (row?.team_id && row.team_id !== TBD_TEAM_ID) return row.team_id;
  return GROUP_SEEDS[groupCode]?.[placeIndex] || TBD_TEAM_ID;
};

const buildRound32PairingsFromStandings = ({ byGroup, meta }, { mode = "predicted" } = {}) => {
  const firsts = GROUP_CODES.map((code) => pickQualifier(byGroup.get(code), 0, code));
  const seconds = GROUP_CODES.map((code) => pickQualifier(byGroup.get(code), 1, code));

  const rankedThirds = rankThirdPlaceCandidates(byGroup, meta, mode);
  const thirdByWinnerSlot = assignThirdPlacesAnnexC(rankedThirds);

  const pairings = OFFICIAL_R32_FIXTURES.map((fixture) => {
    const resolve = (descriptor) => {
      if (descriptor.startsWith("1")) {
        return firsts[GROUP_CODES.indexOf(descriptor[1])] || TBD_TEAM_ID;
      }
      if (descriptor.startsWith("2")) {
        return seconds[GROUP_CODES.indexOf(descriptor[1])] || TBD_TEAM_ID;
      }
      if (descriptor.startsWith("3")) {
        const winnerSlot = R32_THIRD_WINNER_SLOTS[fixture.match_number];
        return (winnerSlot && thirdByWinnerSlot.get(winnerSlot)) || TBD_TEAM_ID;
      }
      return TBD_TEAM_ID;
    };

    return {
      bracket_slot: fixture.bracket_slot,
      match_number: fixture.match_number,
      home_team_id: resolve(fixture.home),
      away_team_id: resolve(fixture.away),
      home_descriptor: fixture.home,
      away_descriptor: fixture.away,
      home_group: fixture.home.length === 2 ? fixture.home[1] : null,
      away_group: fixture.away.length === 2 ? fixture.away[1] : null,
    };
  });

  const qualifiers = GROUP_CODES.map((code) => ({
    group_code: code,
    source: meta.get(code)?.source || "seed",
    first: byGroup.get(code)?.[0] || null,
    second: byGroup.get(code)?.[1] || null,
    third: byGroup.get(code)?.[2] || null,
    meta: meta.get(code),
  }));

  return { pairings, qualifiers, firsts, seconds, thirds: rankedThirds.slice(0, 8) };
};

/** Cruces R32: 1A vs 1B, 1C vs 1D, … luego 2A vs 2B, … y 8 mejores terceros (A–H). */
export const buildRound32PairingsForUser = async (prisma, userId, { mode = "predicted" } = {}) => {
  const standings = mode === "real"
    ? await computeRealGroupStandings(prisma)
    : await computeHybridGroupStandingsForUser(prisma, userId);
  return buildRound32PairingsFromStandings(standings, { mode });
};
