/**
 * Calendario oficial — Fase de grupos Copa Mundial FIFA 2026™
 * 11 de junio – 28 de junio de 2026 (72 partidos)
 * Horas en hora local del estadio; kickoff en UTC vía STADIUM_UTC_OFFSET_HOURS.
 */

/** Horas que se suman a la hora local del estadio para obtener UTC (verano 2026). */
export const STADIUM_UTC_OFFSET_HOURS = {
  AZTECA: 6,
  AKRON: 6,
  BBVA: 6,
  BMO: 4,
  BCPLACE: 7,
  SOFI: 7,
  LEVIS: 7,
  LUMEN: 7,
  NRG: 5,
  ATT: 5,
  ARROWHEAD: 5,
  METLIFE: 4,
  GILLETTE: 4,
  LINCOLN: 4,
  MBS: 4,
  HARDROCK: 4,
};

export const parseKickoffUtc = (date, time, stadiumId) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const offset = STADIUM_UTC_OFFSET_HOURS[stadiumId] ?? 5;
  return new Date(Date.UTC(year, month - 1, day, hour + offset, minute));
};

/** @type {Array<{ home: string, away: string, group: string, stadium: string, date: string, time: string, match_order: number }>} */
export const OFFICIAL_GROUP_FIXTURES = [
  // ——— Grupo A ———
  { group: "A", home: "MEX", away: "RSA", stadium: "AZTECA", date: "2026-06-11", time: "15:00", match_order: 0 },
  { group: "A", home: "KOR", away: "CZE", stadium: "AKRON", date: "2026-06-11", time: "22:00", match_order: 1 },
  { group: "A", home: "CZE", away: "RSA", stadium: "MBS", date: "2026-06-18", time: "12:00", match_order: 2 },
  { group: "A", home: "MEX", away: "KOR", stadium: "AKRON", date: "2026-06-18", time: "21:00", match_order: 3 },
  { group: "A", home: "CZE", away: "MEX", stadium: "AZTECA", date: "2026-06-24", time: "21:00", match_order: 4 },
  { group: "A", home: "RSA", away: "KOR", stadium: "BBVA", date: "2026-06-24", time: "21:00", match_order: 5 },

  // ——— Grupo B ———
  { group: "B", home: "CAN", away: "BIH", stadium: "BMO", date: "2026-06-12", time: "15:00", match_order: 0 },
  { group: "B", home: "QAT", away: "SUI", stadium: "LEVIS", date: "2026-06-13", time: "15:00", match_order: 1 },
  { group: "B", home: "SUI", away: "BIH", stadium: "SOFI", date: "2026-06-18", time: "15:00", match_order: 2 },
  { group: "B", home: "CAN", away: "QAT", stadium: "BCPLACE", date: "2026-06-18", time: "18:00", match_order: 3 },
  { group: "B", home: "SUI", away: "CAN", stadium: "BCPLACE", date: "2026-06-24", time: "15:00", match_order: 4 },
  { group: "B", home: "BIH", away: "QAT", stadium: "LUMEN", date: "2026-06-24", time: "15:00", match_order: 5 },

  // ——— Grupo C ———
  { group: "C", home: "BRA", away: "MAR", stadium: "METLIFE", date: "2026-06-13", time: "18:00", match_order: 0 },
  { group: "C", home: "HAI", away: "SCO", stadium: "GILLETTE", date: "2026-06-13", time: "21:00", match_order: 1 },
  { group: "C", home: "SCO", away: "MAR", stadium: "GILLETTE", date: "2026-06-19", time: "18:00", match_order: 2 },
  { group: "C", home: "BRA", away: "HAI", stadium: "LINCOLN", date: "2026-06-19", time: "20:30", match_order: 3 },
  { group: "C", home: "SCO", away: "BRA", stadium: "HARDROCK", date: "2026-06-24", time: "18:00", match_order: 4 },
  { group: "C", home: "MAR", away: "HAI", stadium: "MBS", date: "2026-06-24", time: "18:00", match_order: 5 },

  // ——— Grupo D ———
  { group: "D", home: "USA", away: "PAR", stadium: "SOFI", date: "2026-06-12", time: "21:00", match_order: 0 },
  { group: "D", home: "AUS", away: "TUR", stadium: "BCPLACE", date: "2026-06-14", time: "00:00", match_order: 1 },
  { group: "D", home: "USA", away: "AUS", stadium: "LUMEN", date: "2026-06-19", time: "15:00", match_order: 2 },
  { group: "D", home: "TUR", away: "PAR", stadium: "LEVIS", date: "2026-06-19", time: "23:00", match_order: 3 },
  { group: "D", home: "TUR", away: "USA", stadium: "SOFI", date: "2026-06-25", time: "22:00", match_order: 4 },
  { group: "D", home: "PAR", away: "AUS", stadium: "LEVIS", date: "2026-06-25", time: "22:00", match_order: 5 },

  // ——— Grupo E ———
  { group: "E", home: "GER", away: "CUW", stadium: "NRG", date: "2026-06-14", time: "13:00", match_order: 0 },
  { group: "E", home: "CIV", away: "ECU", stadium: "LINCOLN", date: "2026-06-14", time: "19:00", match_order: 1 },
  { group: "E", home: "GER", away: "CIV", stadium: "BMO", date: "2026-06-20", time: "16:00", match_order: 2 },
  { group: "E", home: "ECU", away: "CUW", stadium: "ARROWHEAD", date: "2026-06-20", time: "20:00", match_order: 3 },
  { group: "E", home: "CUW", away: "CIV", stadium: "LINCOLN", date: "2026-06-25", time: "16:00", match_order: 4 },
  { group: "E", home: "ECU", away: "GER", stadium: "METLIFE", date: "2026-06-25", time: "16:00", match_order: 5 },

  // ——— Grupo F ———
  { group: "F", home: "NED", away: "JPN", stadium: "ATT", date: "2026-06-14", time: "16:00", match_order: 0 },
  { group: "F", home: "SWE", away: "TUN", stadium: "BBVA", date: "2026-06-14", time: "22:00", match_order: 1 },
  { group: "F", home: "NED", away: "SWE", stadium: "NRG", date: "2026-06-20", time: "13:00", match_order: 2 },
  { group: "F", home: "TUN", away: "JPN", stadium: "BBVA", date: "2026-06-21", time: "00:00", match_order: 3 },
  { group: "F", home: "JPN", away: "SWE", stadium: "ATT", date: "2026-06-25", time: "19:00", match_order: 4 },
  { group: "F", home: "TUN", away: "NED", stadium: "ARROWHEAD", date: "2026-06-25", time: "19:00", match_order: 5 },

  // ——— Grupo G ———
  { group: "G", home: "BEL", away: "EGY", stadium: "LUMEN", date: "2026-06-15", time: "15:00", match_order: 0 },
  { group: "G", home: "IRN", away: "NZL", stadium: "SOFI", date: "2026-06-15", time: "21:00", match_order: 1 },
  { group: "G", home: "BEL", away: "IRN", stadium: "SOFI", date: "2026-06-21", time: "15:00", match_order: 2 },
  { group: "G", home: "NZL", away: "EGY", stadium: "BCPLACE", date: "2026-06-21", time: "21:00", match_order: 3 },
  { group: "G", home: "EGY", away: "IRN", stadium: "LUMEN", date: "2026-06-26", time: "23:00", match_order: 4 },
  { group: "G", home: "NZL", away: "BEL", stadium: "BCPLACE", date: "2026-06-26", time: "23:00", match_order: 5 },

  // ——— Grupo H ———
  { group: "H", home: "ESP", away: "CPV", stadium: "MBS", date: "2026-06-15", time: "12:00", match_order: 0 },
  { group: "H", home: "KSA", away: "URU", stadium: "HARDROCK", date: "2026-06-15", time: "18:00", match_order: 1 },
  { group: "H", home: "ESP", away: "KSA", stadium: "MBS", date: "2026-06-21", time: "12:00", match_order: 2 },
  { group: "H", home: "URU", away: "CPV", stadium: "HARDROCK", date: "2026-06-21", time: "18:00", match_order: 3 },
  { group: "H", home: "CPV", away: "KSA", stadium: "NRG", date: "2026-06-26", time: "20:00", match_order: 4 },
  { group: "H", home: "URU", away: "ESP", stadium: "AKRON", date: "2026-06-26", time: "20:00", match_order: 5 },

  // ——— Grupo I ———
  { group: "I", home: "FRA", away: "SEN", stadium: "METLIFE", date: "2026-06-16", time: "15:00", match_order: 0 },
  { group: "I", home: "IRQ", away: "NOR", stadium: "GILLETTE", date: "2026-06-16", time: "18:00", match_order: 1 },
  { group: "I", home: "FRA", away: "IRQ", stadium: "LINCOLN", date: "2026-06-22", time: "17:00", match_order: 2 },
  { group: "I", home: "NOR", away: "SEN", stadium: "METLIFE", date: "2026-06-22", time: "20:00", match_order: 3 },
  { group: "I", home: "NOR", away: "FRA", stadium: "GILLETTE", date: "2026-06-26", time: "15:00", match_order: 4 },
  { group: "I", home: "SEN", away: "IRQ", stadium: "BMO", date: "2026-06-26", time: "15:00", match_order: 5 },

  // ——— Grupo J ———
  { group: "J", home: "ARG", away: "ALG", stadium: "ARROWHEAD", date: "2026-06-16", time: "21:00", match_order: 0 },
  { group: "J", home: "AUT", away: "JOR", stadium: "LEVIS", date: "2026-06-17", time: "00:00", match_order: 1 },
  { group: "J", home: "ARG", away: "AUT", stadium: "ATT", date: "2026-06-22", time: "13:00", match_order: 2 },
  { group: "J", home: "JOR", away: "ALG", stadium: "LEVIS", date: "2026-06-22", time: "23:00", match_order: 3 },
  { group: "J", home: "ALG", away: "AUT", stadium: "ARROWHEAD", date: "2026-06-27", time: "22:00", match_order: 4 },
  { group: "J", home: "JOR", away: "ARG", stadium: "ATT", date: "2026-06-27", time: "22:00", match_order: 5 },

  // ——— Grupo K ———
  { group: "K", home: "POR", away: "COD", stadium: "NRG", date: "2026-06-17", time: "13:00", match_order: 0 },
  { group: "K", home: "UZB", away: "COL", stadium: "AZTECA", date: "2026-06-17", time: "22:00", match_order: 1 },
  { group: "K", home: "POR", away: "UZB", stadium: "NRG", date: "2026-06-23", time: "13:00", match_order: 2 },
  { group: "K", home: "COL", away: "COD", stadium: "AKRON", date: "2026-06-23", time: "22:00", match_order: 3 },
  { group: "K", home: "COL", away: "POR", stadium: "HARDROCK", date: "2026-06-27", time: "19:30", match_order: 4 },
  { group: "K", home: "COD", away: "UZB", stadium: "MBS", date: "2026-06-27", time: "19:30", match_order: 5 },

  // ——— Grupo L ———
  { group: "L", home: "ENG", away: "CRO", stadium: "ATT", date: "2026-06-17", time: "16:00", match_order: 0 },
  { group: "L", home: "GHA", away: "PAN", stadium: "BMO", date: "2026-06-17", time: "19:00", match_order: 1 },
  { group: "L", home: "ENG", away: "GHA", stadium: "GILLETTE", date: "2026-06-23", time: "16:00", match_order: 2 },
  { group: "L", home: "PAN", away: "CRO", stadium: "BMO", date: "2026-06-23", time: "19:00", match_order: 3 },
  { group: "L", home: "PAN", away: "ENG", stadium: "METLIFE", date: "2026-06-27", time: "17:00", match_order: 4 },
  { group: "L", home: "CRO", away: "GHA", stadium: "LINCOLN", date: "2026-06-27", time: "17:00", match_order: 5 },
];

export const TOURNAMENT_WINDOW = {
  start: "2026-06-11",
  end: "2026-07-19",
  group_stage_end: "2026-06-28",
  knockout_start: "2026-06-28",
  final: "2026-07-19",
};

export const buildOfficialGroupMatches = () => (
  OFFICIAL_GROUP_FIXTURES.map((fixture) => ({
    home: fixture.home,
    away: fixture.away,
    group: fixture.group,
    stadium: fixture.stadium,
    kickoff: parseKickoffUtc(fixture.date, fixture.time, fixture.stadium),
    match_order: fixture.match_order,
    date: fixture.date,
    time: fixture.time,
  }))
);
