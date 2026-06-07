export const KNOCKOUT_PHASE_ORDER = ["ROUND_32", "ROUND_16", "QUARTER", "SEMI", "THIRD_PLACE", "FINAL"];

export const KNOCKOUT_PHASE_LABELS = {
  ROUND_32: "Dieciseisavos",
  ROUND_16: "Octavos",
  QUARTER: "Cuartos",
  SEMI: "Semifinal",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

export const getKnockoutPhaseState = (matches = []) => {
  const completedPhases = [];
  let activePhase = null;

  KNOCKOUT_PHASE_ORDER.forEach((phase) => {
    const phaseMatches = matches.filter((m) => m.phase === phase);
    if (!phaseMatches.length) return;

    const allFinished = phaseMatches.every(
      (m) => m.status === "FINISHED" && m.homeScore != null && m.awayScore != null,
    );

    if (allFinished) {
      completedPhases.push(phase);
    } else if (!activePhase) {
      activePhase = phase;
    }
  });

  return {
    active_phase: activePhase,
    active_phase_label: activePhase ? KNOCKOUT_PHASE_LABELS[activePhase] : null,
    completed_phases: completedPhases,
    all_complete: !activePhase && completedPhases.length > 0,
    phase_order: KNOCKOUT_PHASE_ORDER,
  };
};

export const isKnockoutPhaseLocked = (phase, state) => {
  if (!phase || phase === "GROUP") return false;
  if (!state?.active_phase) return state?.all_complete ? phase !== "FINAL" : true;
  const activeIndex = KNOCKOUT_PHASE_ORDER.indexOf(state.active_phase);
  const phaseIndex = KNOCKOUT_PHASE_ORDER.indexOf(phase);
  if (phaseIndex < 0) return true;
  return phaseIndex !== activeIndex;
};

export const getPredictionWinnerFromGoals = (homeGoals, awayGoals, homeTeamId, awayTeamId) => {
  if (homeGoals == null || awayGoals == null) return null;
  if (homeGoals > awayGoals) return homeTeamId;
  if (awayGoals > homeGoals) return awayTeamId;
  return null;
};
