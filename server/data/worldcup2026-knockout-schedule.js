/**
 * Calendario oficial — Eliminatorias Copa Mundial FIFA 2026™
 * Partidos 73–104 (28 jun – 19 jul 2026)
 */
import { parseKickoffUtc } from "./worldcup2026-schedule.js";

const r32Slot = (matchNumber) => `R32-${String(matchNumber - 72).padStart(2, "0")}`;
const koSlot = (prefix, index) => (prefix === "FINAL" || prefix === "THIRD_PLACE"
  ? prefix
  : `${prefix}-${String(index + 1).padStart(2, "0")}`);

/** Partidos 73–88: dieciseisavos (home/away = descriptor FIFA: 1A, 2B, 3ABCDF, …) */
export const OFFICIAL_R32_FIXTURES = [
  { match_number: 73, home: "2A", away: "2B", stadium: "SOFI", date: "2026-06-28", time: "15:00" },
  { match_number: 76, home: "1C", away: "2F", stadium: "NRG", date: "2026-06-29", time: "13:00" },
  { match_number: 74, home: "1E", away: "3ABCDF", stadium: "GILLETTE", date: "2026-06-29", time: "16:30" },
  { match_number: 75, home: "1F", away: "2C", stadium: "BBVA", date: "2026-06-29", time: "21:00" },
  { match_number: 78, home: "2E", away: "2I", stadium: "ATT", date: "2026-06-30", time: "13:00" },
  { match_number: 77, home: "1I", away: "3CDFGH", stadium: "METLIFE", date: "2026-06-30", time: "17:00" },
  { match_number: 79, home: "1A", away: "3CEFHI", stadium: "AZTECA", date: "2026-06-30", time: "21:00" },
  { match_number: 80, home: "1L", away: "3EHIJK", stadium: "MBS", date: "2026-07-01", time: "12:00" },
  { match_number: 82, home: "1G", away: "3AEHIJ", stadium: "LUMEN", date: "2026-07-01", time: "16:00" },
  { match_number: 81, home: "1D", away: "3BEFIJ", stadium: "LEVIS", date: "2026-07-01", time: "20:00" },
  { match_number: 84, home: "1H", away: "2J", stadium: "SOFI", date: "2026-07-02", time: "15:00" },
  { match_number: 83, home: "2K", away: "2L", stadium: "BMO", date: "2026-07-02", time: "19:00" },
  { match_number: 85, home: "1B", away: "3EFGIJ", stadium: "BCPLACE", date: "2026-07-02", time: "23:00" },
  { match_number: 88, home: "2D", away: "2G", stadium: "ATT", date: "2026-07-03", time: "14:00" },
  { match_number: 86, home: "1J", away: "2H", stadium: "HARDROCK", date: "2026-07-03", time: "18:00" },
  { match_number: 87, home: "1K", away: "3DEIJL", stadium: "ARROWHEAD", date: "2026-07-03", time: "21:30" },
].map((f) => ({
  ...f,
  bracket_slot: r32Slot(f.match_number),
  phase: "ROUND_32",
}));

/** Octavos 89–96: alimentación por ganadores de M73–M88 */
const OFFICIAL_R16_FIXTURES_RAW = [
  { match_number: 90, home_feeder: 73, away_feeder: 75, stadium: "NRG", date: "2026-07-04", time: "13:00" },
  { match_number: 89, home_feeder: 74, away_feeder: 77, stadium: "LINCOLN", date: "2026-07-04", time: "17:00" },
  { match_number: 91, home_feeder: 76, away_feeder: 78, stadium: "METLIFE", date: "2026-07-05", time: "16:00" },
  { match_number: 92, home_feeder: 79, away_feeder: 80, stadium: "AZTECA", date: "2026-07-05", time: "20:00" },
  { match_number: 93, home_feeder: 83, away_feeder: 84, stadium: "ATT", date: "2026-07-06", time: "15:00" },
  { match_number: 94, home_feeder: 81, away_feeder: 82, stadium: "LUMEN", date: "2026-07-06", time: "20:00" },
  { match_number: 95, home_feeder: 86, away_feeder: 88, stadium: "MBS", date: "2026-07-07", time: "12:00" },
  { match_number: 96, home_feeder: 85, away_feeder: 87, stadium: "BCPLACE", date: "2026-07-07", time: "16:00" },
];

const r16Idx = () => Object.fromEntries(OFFICIAL_R16_FIXTURES_RAW.map((f, i) => [f.match_number, i]));

export const OFFICIAL_R16_FIXTURES = OFFICIAL_R16_FIXTURES_RAW.map((f, i) => ({
  ...f,
  bracket_slot: koSlot("R16", i),
  phase: "ROUND_16",
  feeder_home_slot: r32Slot(f.home_feeder),
  feeder_away_slot: r32Slot(f.away_feeder),
}));

const qfIdx = () => Object.fromEntries(OFFICIAL_QF_FIXTURES_RAW.map((f, i) => [f.match_number, i]));

const OFFICIAL_QF_FIXTURES_RAW = [
  { match_number: 97, home_feeder: 89, away_feeder: 90, stadium: "GILLETTE", date: "2026-07-09", time: "16:00" },
  { match_number: 98, home_feeder: 93, away_feeder: 94, stadium: "SOFI", date: "2026-07-10", time: "15:00" },
  { match_number: 99, home_feeder: 91, away_feeder: 92, stadium: "HARDROCK", date: "2026-07-11", time: "17:00" },
  { match_number: 100, home_feeder: 95, away_feeder: 96, stadium: "ARROWHEAD", date: "2026-07-11", time: "21:00" },
];

export const OFFICIAL_QF_FIXTURES = OFFICIAL_QF_FIXTURES_RAW.map((f, i) => {
  const r16 = r16Idx();
  return {
    ...f,
    bracket_slot: koSlot("QF", i),
    phase: "QUARTER",
    feeder_home_slot: koSlot("R16", r16[f.home_feeder]),
    feeder_away_slot: koSlot("R16", r16[f.away_feeder]),
  };
});

export const OFFICIAL_SF_FIXTURES = [
  { match_number: 101, home_feeder: 97, away_feeder: 98, stadium: "ATT", date: "2026-07-14", time: "15:00" },
  { match_number: 102, home_feeder: 99, away_feeder: 100, stadium: "MBS", date: "2026-07-15", time: "15:00" },
].map((f, i) => {
  const qf = qfIdx();
  return {
    ...f,
    bracket_slot: koSlot("SF", i),
    phase: "SEMI",
    feeder_home_slot: koSlot("QF", qf[f.home_feeder]),
    feeder_away_slot: koSlot("QF", qf[f.away_feeder]),
  };
});

export const OFFICIAL_THIRD_PLACE = {
  match_number: 103,
  bracket_slot: "THIRD_PLACE",
  phase: "THIRD_PLACE",
  stadium: "HARDROCK",
  date: "2026-07-18",
  time: "17:00",
  feeder_home_slot: "SF-01",
  feeder_away_slot: "SF-02",
  uses_loser_feeders: true,
};

export const OFFICIAL_FINAL = {
  match_number: 104,
  bracket_slot: "FINAL",
  phase: "FINAL",
  stadium: "METLIFE",
  date: "2026-07-19",
  time: "15:00",
  feeder_home_slot: "SF-01",
  feeder_away_slot: "SF-02",
};

const feederSlotFromMatchNumber = (n) => {
  if (n >= 73 && n <= 88) return r32Slot(n);
  if (n >= 89 && n <= 96) return koSlot("R16", n - 89);
  if (n >= 97 && n <= 100) return koSlot("QF", n - 97);
  if (n === 101) return "SF-01";
  if (n === 102) return "SF-02";
  return null;
};

/** Plantilla del árbol con feeders oficiales FIFA (no emparejamiento binario automático). */
export const buildOfficialBracketTemplate = () => {
  const slots = [];

  OFFICIAL_R32_FIXTURES.forEach((f, i) => {
    slots.push({
      bracket_slot: f.bracket_slot,
      phase: "ROUND_32",
      round_index: 0,
      match_index: i,
      feeder_home_slot: null,
      feeder_away_slot: null,
      label: "Dieciseisavos",
      fifa_match_number: f.match_number,
    });
  });

  OFFICIAL_R16_FIXTURES.forEach((f, i) => {
    slots.push({
      bracket_slot: f.bracket_slot,
      phase: "ROUND_16",
      round_index: 1,
      match_index: i,
      feeder_home_slot: f.feeder_home_slot,
      feeder_away_slot: f.feeder_away_slot,
      label: "Octavos",
      fifa_match_number: f.match_number,
    });
  });

  OFFICIAL_QF_FIXTURES.forEach((f, i) => {
    slots.push({
      bracket_slot: f.bracket_slot,
      phase: "QUARTER",
      round_index: 2,
      match_index: i,
      feeder_home_slot: f.feeder_home_slot,
      feeder_away_slot: f.feeder_away_slot,
      label: "Cuartos",
      fifa_match_number: f.match_number,
    });
  });

  OFFICIAL_SF_FIXTURES.forEach((f, i) => {
    slots.push({
      bracket_slot: f.bracket_slot,
      phase: "SEMI",
      round_index: 3,
      match_index: i,
      feeder_home_slot: f.feeder_home_slot,
      feeder_away_slot: f.feeder_away_slot,
      label: "Semifinal",
      fifa_match_number: f.match_number,
    });
  });

  slots.push({
    bracket_slot: OFFICIAL_THIRD_PLACE.bracket_slot,
    phase: "THIRD_PLACE",
    round_index: 4,
    match_index: 0,
    feeder_home_slot: OFFICIAL_THIRD_PLACE.feeder_home_slot,
    feeder_away_slot: OFFICIAL_THIRD_PLACE.feeder_away_slot,
    label: "Tercer puesto",
    fifa_match_number: OFFICIAL_THIRD_PLACE.match_number,
    uses_loser_feeders: true,
  });

  slots.push({
    bracket_slot: OFFICIAL_FINAL.bracket_slot,
    phase: "FINAL",
    round_index: 5,
    match_index: 0,
    feeder_home_slot: OFFICIAL_FINAL.feeder_home_slot,
    feeder_away_slot: OFFICIAL_FINAL.feeder_away_slot,
    label: "Final",
    fifa_match_number: OFFICIAL_FINAL.match_number,
  });

  return slots;
};

export const buildOfficialKnockoutMatches = () => {
  const rows = [];

  const pushRow = (fixture) => {
    rows.push({
      ...fixture,
      kickoff: parseKickoffUtc(fixture.date, fixture.time, fixture.stadium),
      bracket_order: fixture.match_number,
    });
  };

  OFFICIAL_R32_FIXTURES.forEach(pushRow);
  OFFICIAL_R16_FIXTURES.forEach(pushRow);
  OFFICIAL_QF_FIXTURES.forEach(pushRow);
  OFFICIAL_SF_FIXTURES.forEach(pushRow);
  pushRow(OFFICIAL_THIRD_PLACE);
  pushRow(OFFICIAL_FINAL);

  return rows;
};

export const matchNumberToBracketSlot = (matchNumber) => feederSlotFromMatchNumber(matchNumber);
