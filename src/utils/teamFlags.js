/** Códigos flagcdn.com (ISO 3166-1) por ID FIFA de 3 letras */
export const TEAM_FLAG_CODES = {
  MEX: "mx",
  RSA: "za",
  KOR: "kr",
  CZE: "cz",
  CAN: "ca",
  BIH: "ba",
  QAT: "qa",
  SUI: "ch",
  BRA: "br",
  MAR: "ma",
  HAI: "ht",
  SCO: "gb-sct",
  USA: "us",
  PAR: "py",
  AUS: "au",
  TUR: "tr",
  GER: "de",
  CUW: "cw",
  CIV: "ci",
  ECU: "ec",
  NED: "nl",
  JPN: "jp",
  SWE: "se",
  TUN: "tn",
  BEL: "be",
  EGY: "eg",
  IRN: "ir",
  NZL: "nz",
  ESP: "es",
  CPV: "cv",
  KSA: "sa",
  URU: "uy",
  FRA: "fr",
  SEN: "sn",
  IRQ: "iq",
  NOR: "no",
  ARG: "ar",
  ALG: "dz",
  AUT: "at",
  JOR: "jo",
  POR: "pt",
  COD: "cd",
  UZB: "uz",
  COL: "co",
  ENG: "gb-eng",
  CRO: "hr",
  GHA: "gh",
  PAN: "pa",
};

export const getTeamFlagCode = (teamId) => {
  if (!teamId || teamId === "TBD") return null;
  return TEAM_FLAG_CODES[String(teamId).trim().toUpperCase()] || null;
};

export const getTeamFlagUrl = (teamId, width = 40) => {
  const code = getTeamFlagCode(teamId);
  if (!code) return null;
  const w = Math.max(20, Math.round(width));
  return `https://flagcdn.com/w${w}/${code}.png`;
};
