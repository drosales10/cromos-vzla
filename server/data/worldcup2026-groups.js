/** 12 grupos × 4 selecciones × 6 partidos = 72 encuentros de fase de grupos */
export const GROUP_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

/**
 * Sorteo oficial FIFA (06/07/2026) — orden 1° a 4° en la tabla inicial.
 * Fuente única para grupos, semillas, clasificación y bracket.
 */
export const OFFICIAL_FIFA_GROUPS = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

export const buildGroupAssignments = () => ({ ...OFFICIAL_FIFA_GROUPS });

export const getOfficialGroupTeams = (groupCode) => (
  OFFICIAL_FIFA_GROUPS[String(groupCode).trim().toUpperCase()] || []
);

export const officialSeedIndex = (groupCode, teamId) => {
  const order = getOfficialGroupTeams(groupCode);
  const idx = order.indexOf(teamId);
  return idx >= 0 ? idx : 99;
};

/** Calendario oficial FIFA — 72 partidos de fase de grupos (11–28 jun 2026). */
export { buildOfficialGroupMatches as buildAllGroupMatches } from "./worldcup2026-schedule.js";

/** 32 clasificados demo: 1° y 2° de cada grupo + 8 mejores terceros (grupos A–H) */
export const buildRound32Qualifiers = () => {
  const groups = buildGroupAssignments();
  const firsts = GROUP_CODES.map((code) => groups[code][0]);
  const seconds = GROUP_CODES.map((code) => groups[code][1]);
  const thirds = GROUP_CODES.slice(0, 8).map((code) => groups[code][2]);
  return [...firsts, ...seconds, ...thirds];
};

/** 16 cruces de dieciseisavos para modo simulación (32 equipos reales) */
export const buildRound32SimulationPairings = () => {
  const teams = buildRound32Qualifiers();
  const pairings = [];
  for (let i = 0; i < 16; i += 1) {
    pairings.push({
      bracket_slot: `R32-${String(i + 1).padStart(2, "0")}`,
      home: teams[i * 2],
      away: teams[i * 2 + 1],
    });
  }
  return pairings;
};
