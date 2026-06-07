import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { SECTIONS_RAW } from "../src/albumData.js";
import { refreshMatchTravelDistances, syncMatchWeather } from "./services/matchesService.js";
import {
  ensureTbdTeam,
  generateBracketMatches,
  seedGroupStageMatches,
} from "./services/bracketService.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

const STADIUMS = [
  { id: "METLIFE", name: "Estadio Nueva York/Nueva Jersey", city: "Nueva Jersey", country: "USA", latitude: 40.8128, longitude: -74.0742, altitudeM: 3, capacity: 82500 },
  { id: "SOFI", name: "Estadio Los Angeles", city: "Los Ángeles", country: "USA", latitude: 33.9535, longitude: -118.3392, altitudeM: 36, capacity: 70240 },
  { id: "ATT", name: "Estadio Dallas", city: "Dallas", country: "USA", latitude: 32.7473, longitude: -97.0945, altitudeM: 184, capacity: 80000 },
  { id: "NRG", name: "Estadio Houston", city: "Houston", country: "USA", latitude: 29.6847, longitude: -95.4107, altitudeM: 13, capacity: 72220 },
  { id: "MBS", name: "Estadio Atlanta", city: "Atlanta", country: "USA", latitude: 33.7553, longitude: -84.4006, altitudeM: 320, capacity: 71000 },
  { id: "HARDROCK", name: "Estadio Miami", city: "Miami", country: "USA", latitude: 25.9580, longitude: -80.2389, altitudeM: 2, capacity: 65326 },
  { id: "LEVIS", name: "Estadio Bahía de San Francisco", city: "Área de la Bahía", country: "USA", latitude: 37.4030, longitude: -121.9694, altitudeM: 7, capacity: 68500 },
  { id: "LUMEN", name: "Estadio Seattle", city: "Seattle", country: "USA", latitude: 47.5952, longitude: -122.3316, altitudeM: 3, capacity: 69000 },
  { id: "GILLETTE", name: "Estadio Boston", city: "Boston", country: "USA", latitude: 42.0909, longitude: -71.2643, altitudeM: 164, capacity: 65878 },
  { id: "LINCOLN", name: "Estadio Filadelfia", city: "Filadelfia", country: "USA", latitude: 39.9008, longitude: -75.1675, altitudeM: 12, capacity: 69596 },
  { id: "ARROWHEAD", name: "Estadio Kansas City", city: "Kansas City", country: "USA", latitude: 39.0489, longitude: -94.4839, altitudeM: 260, capacity: 76416 },
  { id: "BCPLACE", name: "Estadio BC Place", city: "Vancouver", country: "Canada", latitude: 49.2768, longitude: -123.1120, altitudeM: 4, capacity: 54500 },
  { id: "BMO", name: "Estadio Toronto", city: "Toronto", country: "Canada", latitude: 43.6332, longitude: -79.4186, altitudeM: 76, capacity: 45000 },
  { id: "AZTECA", name: "Estadio Ciudad de México", city: "Ciudad de México", country: "Mexico", latitude: 19.3029, longitude: -99.1505, altitudeM: 2240, capacity: 87523 },
  { id: "AKRON", name: "Estadio Guadalajara", city: "Guadalajara", country: "Mexico", latitude: 20.6818, longitude: -103.4626, altitudeM: 1570, capacity: 49850 },
  { id: "BBVA", name: "Estadio Monterrey", city: "Monterrey", country: "Mexico", latitude: 25.6866, longitude: -100.2450, altitudeM: 510, capacity: 53500 },
];

const TEAM_META = {
  ARG: { fifaRanking: 1, squadValueM: 850, worldCupsPlayed: 18, homeLat: -34.6037, homeLon: -58.3816, temp: 18, hum: 65 },
  FRA: { fifaRanking: 2, squadValueM: 1200, worldCupsPlayed: 16, homeLat: 48.8566, homeLon: 2.3522, temp: 12, hum: 70 },
  BRA: { fifaRanking: 3, squadValueM: 1100, worldCupsPlayed: 22, homeLat: -23.5505, homeLon: -46.6333, temp: 24, hum: 75 },
  ENG: { fifaRanking: 4, squadValueM: 1400, worldCupsPlayed: 16, homeLat: 51.5074, homeLon: -0.1278, temp: 11, hum: 78 },
  ESP: { fifaRanking: 5, squadValueM: 950, worldCupsPlayed: 16, homeLat: 40.4168, homeLon: -3.7038, temp: 15, hum: 55 },
  GER: { fifaRanking: 6, squadValueM: 900, worldCupsPlayed: 20, homeLat: 52.5200, homeLon: 13.4050, temp: 10, hum: 72 },
  POR: { fifaRanking: 7, squadValueM: 800, worldCupsPlayed: 8, homeLat: 38.7223, homeLon: -9.1393, temp: 17, hum: 68 },
  NED: { fifaRanking: 8, squadValueM: 750, worldCupsPlayed: 11, homeLat: 52.3676, homeLon: 4.9041, temp: 10, hum: 80 },
  USA: { fifaRanking: 11, squadValueM: 320, worldCupsPlayed: 11, homeLat: 38.9072, homeLon: -77.0369, temp: 14, hum: 60 },
  MEX: { fifaRanking: 14, squadValueM: 210, worldCupsPlayed: 18, homeLat: 19.4326, homeLon: -99.1332, temp: 18, hum: 55 },
  COL: { fifaRanking: 12, squadValueM: 280, worldCupsPlayed: 6, homeLat: 4.7110, homeLon: -74.0721, temp: 14, hum: 75 },
  URU: { fifaRanking: 10, squadValueM: 400, worldCupsPlayed: 14, homeLat: -34.9011, homeLon: -56.1645, temp: 16, hum: 70 },
  JPN: { fifaRanking: 18, squadValueM: 300, worldCupsPlayed: 7, homeLat: 35.6762, homeLon: 139.6503, temp: 16, hum: 65 },
  KOR: { fifaRanking: 23, squadValueM: 180, worldCupsPlayed: 11, homeLat: 37.5665, homeLon: 126.9780, temp: 12, hum: 60 },
  CAN: { fifaRanking: 41, squadValueM: 150, worldCupsPlayed: 3, homeLat: 45.4215, homeLon: -75.6972, temp: 6, hum: 70 },
};

const DEFAULT_META = { fifaRanking: 40, squadValueM: 80, worldCupsPlayed: 2, homeLat: 0, homeLon: 0, temp: 20, hum: 55 };

async function main() {
  console.log("Seeding estadios...");
  for (const s of STADIUMS) {
    await prisma.stadium.upsert({
      where: { id: s.id },
      create: { id: s.id, name: s.name, city: s.city, country: s.country, latitude: s.latitude, longitude: s.longitude, altitudeM: s.altitudeM, capacity: s.capacity },
      update: { name: s.name, city: s.city, country: s.country, latitude: s.latitude, longitude: s.longitude, altitudeM: s.altitudeM, capacity: s.capacity },
    });
  }

  await ensureTbdTeam(prisma);

  console.log("Seeding selecciones...");
  const teams = SECTIONS_RAW.filter((s) => !s.special);
  for (const t of teams) {
    const meta = TEAM_META[t.id] || DEFAULT_META;
    await prisma.team.upsert({
      where: { id: t.id },
      create: {
        id: t.id, name: t.name, country: t.name, flagEmoji: t.flag, sectionId: t.id,
        fifaRanking: meta.fifaRanking, squadValueM: meta.squadValueM, worldCupsPlayed: meta.worldCupsPlayed,
        homeLatitude: meta.homeLat, homeLongitude: meta.homeLon, homeAvgTempC: meta.temp, homeHumidityPct: meta.hum,
      },
      update: {
        name: t.name, flagEmoji: t.flag, sectionId: t.id,
        fifaRanking: meta.fifaRanking, squadValueM: meta.squadValueM, worldCupsPlayed: meta.worldCupsPlayed,
        homeLatitude: meta.homeLat, homeLongitude: meta.homeLon, homeAvgTempC: meta.temp, homeHumidityPct: meta.hum,
      },
    });
  }

  console.log("Seeding calendario oficial — 72 partidos de grupos (11–28 jun 2026)...");
  const groupResult = await seedGroupStageMatches(prisma, { syncSchedule: true });
  const removed = groupResult.removed_count ? `, ${groupResult.removed_count} obsoletos eliminados` : "";
  console.log(`  → ${groupResult.created_count} creados, ${groupResult.updated_count} actualizados${removed} (${groupResult.existing} en DB)`);

  console.log("Seeding calendario oficial de eliminatorias (partidos 73–104)...");
  const koResult = await generateBracketMatches(prisma, { syncSchedule: true });
  console.log(`  → ${koResult.created_count} creados, ${koResult.updated_count} actualizados (${koResult.total_slots} llaves)`);

  console.log("Calculando distancias y clima...");
  const weatherKey = process.env.OPENWEATHER_API_KEY || "";
  const allIds = (await prisma.match.findMany({ select: { id: true } })).map((r) => r.id);
  for (const id of allIds) {
    await refreshMatchTravelDistances(prisma, id);
    await syncMatchWeather(prisma, id, weatherKey);
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
