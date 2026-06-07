/**
 * Anexo C FIFA — asignación de mejores terceros a cruces de dieciseisavos.
 * Cada fila: grupos cuyo 3° clasifica + asignación a slots 1A,1B,1D,1E,1G,1I,1K,1L.
 * Fuente: Reglamento FIFA / Wikipedia (495 combinaciones; subconjunto + fallback).
 */
const WINNER_SLOTS = ["A", "B", "D", "E", "G", "I", "K", "L"];

/** @type {Array<{ groups: string, assign: Record<string, string> }>} */
const ANNEX_C_ROWS = [
  { groups: "EFGHIJKL", assign: { A: "E", B: "J", D: "I", E: "F", G: "H", I: "G", K: "L", L: "K" } },
  { groups: "DFGHIJKL", assign: { A: "H", B: "G", D: "I", E: "D", G: "J", I: "F", K: "L", L: "K" } },
  { groups: "DEGHIJKL", assign: { A: "E", B: "J", D: "I", E: "D", G: "H", I: "G", K: "L", L: "K" } },
  { groups: "DEFHIJKL", assign: { A: "E", B: "J", D: "I", E: "D", G: "H", I: "F", K: "L", L: "K" } },
  { groups: "DEFGHIJKL", assign: { A: "E", B: "G", D: "I", E: "D", G: "J", I: "F", K: "L", L: "K" } },
  { groups: "CDEFGHIJ", assign: { A: "E", B: "G", D: "I", E: "C", G: "J", I: "F", K: "H", L: "D" } },
  { groups: "BCDEFGHI", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "C", L: "D" } },
  { groups: "ABCDEFGH", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "C", L: "D" } },
  { groups: "ABCDEFGI", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "C", L: "A" } },
  { groups: "ABCDEFGJ", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "C", L: "A" } },
  { groups: "ABCDEFGK", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "A", L: "C" } },
  { groups: "ABCDEFGL", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "C", L: "A" } },
  { groups: "ABCDEFHL", assign: { A: "H", B: "G", D: "I", E: "B", G: "J", I: "F", K: "C", L: "A" } },
  { groups: "ABCDEHIJ", assign: { A: "E", B: "J", D: "I", E: "B", G: "H", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEFIJ", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGHJ", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGHI", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGHK", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEGHL", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGIJ", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGIK", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEGIL", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGJK", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEGJL", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEGKL", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEHJK", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "H", K: "D", L: "C" } },
  { groups: "ABCDEHJL", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "H", K: "C", L: "D" } },
  { groups: "ABCDEHKL", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEHIK", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEHIJ", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "H", K: "D", L: "C" } },
  { groups: "ABCDEIJK", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEIKL", assign: { A: "E", B: "G", D: "I", E: "B", G: "H", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEJKL", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEFIJ", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEFIK", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEFIL", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEFJK", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEFJL", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "C", L: "D" } },
  { groups: "ABCDEFKL", assign: { A: "E", B: "J", D: "I", E: "B", G: "F", I: "A", K: "D", L: "C" } },
  { groups: "ABCDEFGHIJKL", assign: { A: "E", B: "G", D: "I", E: "B", G: "J", I: "F", K: "H", L: "C" } },
];

const ANNEX_LOOKUP = new Map(
  ANNEX_C_ROWS.map((row) => [row.groups.split("").sort().join(""), row.assign]),
);

/** Slots de 1° que reciben un 3° y descriptor del partido R32. */
export const R32_THIRD_WINNER_SLOTS = {
  74: "E",
  77: "I",
  79: "A",
  80: "L",
  81: "D",
  82: "G",
  85: "B",
  87: "K",
};

const compareThirdRows = (a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
  if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
  return (a.group_code || "").localeCompare(b.group_code || "", "es");
};

/**
 * @param {Array<{ group_code: string, team_id: string, points: number, goal_diff: number, goals_for: number }>} rankedThirds
 * @returns {Map<string, string>} winner slot (A,B,…) → team_id del 3° asignado
 */
const ELIGIBLE_THIRDS_BY_MATCH = {
  74: "ABCDF",
  77: "CDFGH",
  79: "CEFHI",
  80: "EHIJK",
  81: "BEFIJ",
  82: "AEHIJ",
  85: "EFGIJ",
  87: "DEIJL",
};

const fillThirdPlaceSlot = (qualifying, winnerSlot, matchNum, usedGroups) => {
  const eligible = (ELIGIBLE_THIRDS_BY_MATCH[matchNum] || "").split("");
  const pick = [...qualifying]
    .filter((t) => eligible.includes(t.group_code) && !usedGroups.has(t.group_code))
    .sort(compareThirdRows)[0];
  if (!pick) return null;
  usedGroups.add(pick.group_code);
  return pick.team_id;
};

export const assignThirdPlacesAnnexC = (rankedThirds) => {
  const qualifying = rankedThirds.slice(0, 8);
  if (qualifying.length < 8) return new Map();

  const key = qualifying.map((t) => t.group_code).sort().join("");
  const annexRow = ANNEX_LOOKUP.get(key);
  const teamByGroup = Object.fromEntries(qualifying.map((t) => [t.group_code, t.team_id]));
  const usedGroups = new Set();
  const result = new Map();

  if (annexRow) {
    WINNER_SLOTS.forEach((slot) => {
      const sourceGroup = annexRow[slot];
      const teamId = sourceGroup ? teamByGroup[sourceGroup] : null;
      if (teamId) {
        result.set(slot, teamId);
        usedGroups.add(sourceGroup);
      }
    });
  }

  Object.entries(R32_THIRD_WINNER_SLOTS).forEach(([matchNum, winnerSlot]) => {
    if (result.has(winnerSlot)) return;
    const teamId = fillThirdPlaceSlot(qualifying, winnerSlot, Number(matchNum), usedGroups);
    if (teamId) result.set(winnerSlot, teamId);
  });

  return result;
};

const ALL_GROUP_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const rankThirdPlaceCandidates = (byGroup, meta, mode) => {
  const candidates = [];
  for (const code of ALL_GROUP_CODES) {
    const row = byGroup.get(code)?.[2];
    if (!row || row.team_id === "TBD") continue;
    // Predicho: sin partidos contados aún no hay proyección de 3°
    if (mode === "predicted" && row.played < 1 && !meta.get(code)?.matches_from_prediction) continue;
    // Real: la tabla ya fija el 3° (orden FIFA con 0 PJ) → siempre candidato
    candidates.push({ ...row, group_code: code });
  }
  return candidates.sort(compareThirdRows);
};
