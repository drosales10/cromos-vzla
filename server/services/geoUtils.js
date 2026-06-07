const EARTH_RADIUS_KM = 6371;

export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const fatigueIndex = (travelKm) => {
  const km = Number(travelKm) || 0;
  if (km <= 500) return 0;
  if (km <= 1500) return 15;
  if (km <= 3000) return 35;
  if (km <= 5000) return 55;
  return 75;
};

export const climateComfortIndex = (teamHome, venueWeather) => {
  if (!teamHome || !venueWeather) return 50;
  const homeTemp = Number(teamHome.homeAvgTempC ?? 20);
  const homeHum = Number(teamHome.homeHumidityPct ?? 50);
  const venueTemp = Number(venueWeather.temperatureC ?? 20);
  const venueHum = Number(venueWeather.humidityPct ?? 50);
  const tempDelta = Math.abs(homeTemp - venueTemp);
  const humDelta = Math.abs(homeHum - venueHum);
  const tempPenalty = Math.min(40, tempDelta * 2.5);
  const humPenalty = Math.min(25, humDelta * 0.5);
  const extremePenalty = /snow|storm|extreme|thunder/i.test(venueWeather.conditions || "") ? 15 : 0;
  return Math.max(0, Math.round(100 - tempPenalty - humPenalty - extremePenalty));
};

export const squadPowerIndex = (team) => {
  if (!team) return 50;
  const ranking = Number(team.fifaRanking || 50);
  const value = Number(team.squadValueM || 100);
  const experience = Number(team.worldCupsPlayed || 0);
  const rankScore = Math.max(0, 100 - ranking);
  const valueScore = Math.min(100, (value / 15) * 10);
  const expScore = Math.min(20, experience * 2);
  return Math.round(rankScore * 0.45 + valueScore * 0.4 + expScore);
};
