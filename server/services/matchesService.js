import { haversineKm, fatigueIndex, climateComfortIndex, squadPowerIndex } from "./geoUtils.js";
import { getStadiumWeatherCached, upsertMatchWeather } from "./weatherService.js";

const num = (v) => (v == null ? null : Number(v));

export const mapStadiumOut = (row) => ({
  id: row.id,
  name: row.name,
  city: row.city,
  country: row.country,
  latitude: num(row.latitude),
  longitude: num(row.longitude),
  altitude_m: row.altitudeM,
  capacity: row.capacity,
});

export const mapTeamOut = (row) => ({
  id: row.id,
  name: row.name,
  country: row.country,
  flag_emoji: row.flagEmoji,
  section_id: row.sectionId,
  fifa_ranking: row.fifaRanking,
  squad_value_m: num(row.squadValueM),
  world_cups_played: row.worldCupsPlayed,
  home_latitude: num(row.homeLatitude),
  home_longitude: num(row.homeLongitude),
  home_avg_temp_c: num(row.homeAvgTempC),
  home_humidity_pct: row.homeHumidityPct,
});

export const mapWeatherOut = (row) => row ? ({
  temperature_c: num(row.temperatureC),
  humidity_pct: row.humidityPct,
  conditions: row.conditions,
  wind_speed_ms: num(row.windSpeedMs),
  fetched_at: row.fetchedAt,
  simulated: /simulado/i.test(row.conditions || ""),
}) : null;

export const buildMatchAnalytics = (match) => {
  const weather = match.weather;
  const home = match.homeTeam;
  const away = match.awayTeam;
  const homeTravel = num(match.homeTravelKm) || 0;
  const awayTravel = num(match.awayTravelKm) || 0;

  return {
    home: {
      climate_comfort: climateComfortIndex(home, weather),
      fatigue_index: fatigueIndex(homeTravel),
      travel_km: homeTravel,
      squad_power: squadPowerIndex(home),
    },
    away: {
      climate_comfort: climateComfortIndex(away, weather),
      fatigue_index: fatigueIndex(awayTravel),
      travel_km: awayTravel,
      squad_power: squadPowerIndex(away),
    },
    weather: mapWeatherOut(weather),
    stadium: mapStadiumOut(match.stadium),
  };
};

export const mapMatchOut = (match, { includeAnalytics = false } = {}) => {
  const base = {
    id: match.id,
    home_team: mapTeamOut(match.homeTeam),
    away_team: mapTeamOut(match.awayTeam),
    stadium: mapStadiumOut(match.stadium),
    kickoff_at: match.kickoffAt,
    status: match.status,
    phase: match.phase,
    group_code: match.groupCode,
    home_score: match.homeScore,
    away_score: match.awayScore,
    home_travel_km: num(match.homeTravelKm),
    away_travel_km: num(match.awayTravelKm),
    weather: mapWeatherOut(match.weather),
    predictions_scored_at: match.predictionsScoredAt,
    bracket_slot: match.bracketSlot,
    feeder_home_slot: match.feederHomeSlot,
    feeder_away_slot: match.feederAwaySlot,
    bracket_order: match.bracketOrder,
  };
  if (includeAnalytics) {
    base.analytics = buildMatchAnalytics(match);
  }
  return base;
};

const matchInclude = {
  homeTeam: true,
  awayTeam: true,
  stadium: true,
  weather: true,
};

export const computeTeamTravelKm = async (prisma, teamId, currentStadium, kickoffAt) => {
  const previous = await prisma.match.findFirst({
    where: {
      kickoffAt: { lt: kickoffAt },
      status: { in: ["SCHEDULED", "LIVE", "FINISHED"] },
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    orderBy: { kickoffAt: "desc" },
    include: { stadium: true },
  });

  const fromLat = previous
    ? Number(previous.stadium.latitude)
    : Number((await prisma.team.findUnique({ where: { id: teamId } }))?.homeLatitude || currentStadium.latitude);
  const fromLon = previous
    ? Number(previous.stadium.longitude)
    : Number((await prisma.team.findUnique({ where: { id: teamId } }))?.homeLongitude || currentStadium.longitude);

  return haversineKm(
    fromLat,
    fromLon,
    Number(currentStadium.latitude),
    Number(currentStadium.longitude),
  );
};

export const refreshMatchTravelDistances = async (prisma, matchId) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { stadium: true },
  });
  if (!match) return null;

  const [homeTravelKm, awayTravelKm] = await Promise.all([
    computeTeamTravelKm(prisma, match.homeTeamId, match.stadium, match.kickoffAt),
    computeTeamTravelKm(prisma, match.awayTeamId, match.stadium, match.kickoffAt),
  ]);

  return prisma.match.update({
    where: { id: matchId },
    data: {
      homeTravelKm,
      awayTravelKm,
    },
    include: matchInclude,
  });
};

export const syncMatchWeather = async (prisma, matchId, apiKey, { force = false } = {}) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { stadium: true },
  });
  if (!match) return null;

  const weather = await getStadiumWeatherCached(prisma, match.stadium, apiKey, { force });
  await upsertMatchWeather(prisma, matchId, weather);
  return prisma.match.findUnique({ where: { id: matchId }, include: matchInclude });
};

const parseDayBounds = (dateStr) => {
  const day = String(dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return {
    gte: new Date(`${day}T00:00:00.000Z`),
    lte: new Date(`${day}T23:59:59.999Z`),
  };
};

export const listMatches = async (prisma, { phase, status, from, to, groupCode, date } = {}) => {
  const where = {};
  if (phase) where.phase = phase;
  if (status) where.status = status;
  if (groupCode) where.groupCode = String(groupCode).trim().toUpperCase();

  const dayBounds = date ? parseDayBounds(date) : null;
  if (dayBounds) {
    where.kickoffAt = dayBounds;
  } else if (from || to) {
    where.kickoffAt = {};
    if (from) where.kickoffAt.gte = new Date(from);
    if (to) where.kickoffAt.lte = new Date(to);
  }

  const rows = await prisma.match.findMany({
    where,
    orderBy: { kickoffAt: "asc" },
    include: matchInclude,
  });
  return rows;
};

export const getMatchById = async (prisma, matchId) => prisma.match.findUnique({
  where: { id: matchId },
  include: matchInclude,
});
