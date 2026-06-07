import { TBD_TEAM_ID, buildBracketTemplate } from "./bracketService.js";
import {
  getPredictionWinnerFromGoals,
  isKnockoutPhaseLocked,
} from "./knockoutPhaseService.js";

const teamBriefFromDb = async (prisma, teamId, albumComplete = {}) => {
  if (!teamId || teamId === TBD_TEAM_ID) {
    return { id: TBD_TEAM_ID, name: "Por definir", flag_emoji: "❓", section_id: null, album_complete: false, is_placeholder: true };
  }
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { id: TBD_TEAM_ID, name: "Por definir", flag_emoji: "❓", section_id: null, album_complete: false, is_placeholder: true };
  }
  return {
    id: team.id,
    name: team.name,
    flag_emoji: team.flagEmoji,
    section_id: team.sectionId,
    album_complete: !!albumComplete[team.sectionId],
    is_placeholder: false,
  };
};

const getEffectiveWinnerId = (node, viewMode = "predicted") => {
  if (node.has_winner && node.winner_id) return node.winner_id;
  if (viewMode === "real") return null;

  const pred = node.prediction;
  if (!pred || pred.home_goals == null || pred.away_goals == null) return null;

  return getPredictionWinnerFromGoals(
    pred.home_goals,
    pred.away_goals,
    node.home?.id,
    node.away?.id,
  );
};

export const applyPredictionsToNodes = async (
  prisma,
  nodes,
  knockoutState,
  albumComplete = {},
  viewMode = "predicted",
) => {
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

    const phaseLocked = isKnockoutPhaseLocked(node.phase, knockoutState);
    node.phase_locked = phaseLocked;
    node.can_predict = !!node.match_id
      && !node.has_winner
      && !phaseLocked
      && !node.locked
      && !node.kickoff_locked
      && !node.home?.is_placeholder
      && !node.away?.is_placeholder
      && node.status !== "FINISHED";

    let homeId = node.home?.is_placeholder ? null : node.home?.id;
    let awayId = node.away?.is_placeholder ? null : node.away?.id;

    if (slot.feeder_home_slot) {
      const feeder = nodeMap.get(slot.feeder_home_slot);
      if (feeder) {
        const winnerId = getEffectiveWinnerId(feeder, viewMode);
        if (winnerId && winnerId !== TBD_TEAM_ID) homeId = winnerId;
      }
    }
    if (slot.feeder_away_slot) {
      const feeder = nodeMap.get(slot.feeder_away_slot);
      if (feeder) {
        const winnerId = getEffectiveWinnerId(feeder, viewMode);
        if (winnerId && winnerId !== TBD_TEAM_ID) awayId = winnerId;
      }
    }

    if (homeId && homeId !== TBD_TEAM_ID) node.home = await resolveTeam(homeId);
    if (awayId && awayId !== TBD_TEAM_ID) node.away = await resolveTeam(awayId);

    const predictedWinnerId = viewMode === "predicted" && !node.has_winner
      ? getEffectiveWinnerId(node, viewMode)
      : null;
    node.predicted_winner_id = predictedWinnerId;
    node.has_predicted_winner = !!predictedWinnerId;
  }

  return nodes;
};

export const getPredictedChampion = async (prisma, nodes) => {
  const finalNode = nodes.find((n) => n.bracket_slot === "FINAL");
  if (!finalNode) return null;

  const winnerId = finalNode.has_winner
    ? finalNode.winner_id
    : getEffectiveWinnerId(finalNode);

  if (!winnerId || winnerId === TBD_TEAM_ID) return null;

  const team = await prisma.team.findUnique({ where: { id: winnerId } });
  if (!team) return null;

  return {
    id: team.id,
    name: team.name,
    flag_emoji: team.flagEmoji,
    from_real_result: !!finalNode.has_winner,
  };
};
