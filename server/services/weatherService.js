const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather";
const WEATHER_CACHE_HOURS = Number(process.env.WEATHER_CACHE_HOURS || 24);

const conditionLabel = (code, main) => {
  if (code >= 200 && code < 300) return "Tormenta";
  if (code >= 300 && code < 600) return "Lluvia";
  if (code >= 600 && code < 700) return "Nieve";
  if (code >= 700 && code < 800) return "Niebla";
  if (code === 800) return "Despejado";
  if (code > 800) return "Nublado";
  return main || "Desconocido";
};

const simulatedWeather = () => ({
  temperatureC: 22,
  humidityPct: 55,
  conditions: "Simulado (sin API key)",
  windSpeedMs: 3,
  simulated: true,
});

export const mapWeatherData = (row) => ({
  temperatureC: Number(row.temperatureC),
  humidityPct: row.humidityPct,
  conditions: row.conditions,
  windSpeedMs: row.windSpeedMs != null ? Number(row.windSpeedMs) : null,
  simulated: !!row.simulated,
  fetchedAt: row.fetchedAt,
  fromCache: true,
});

const isCacheFresh = (fetchedAt) => {
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  return ageMs < WEATHER_CACHE_HOURS * 60 * 60 * 1000;
};

export const fetchStadiumWeatherFromApi = async (latitude, longitude, apiKey) => {
  if (!apiKey) return simulatedWeather();

  const url = `${OPENWEATHER_BASE}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);

  if (res.status === 401) {
    throw new Error(
      "OpenWeatherMap 401: la API key puede tardar entre 10 minutos y 2 horas en activarse. Reintentá más tarde.",
    );
  }
  if (!res.ok) {
    throw new Error(`OpenWeatherMap error: ${res.status}`);
  }

  const data = await res.json();
  const weather = data.weather?.[0] || {};
  return {
    temperatureC: Number(data.main?.temp ?? 20),
    humidityPct: Number(data.main?.humidity ?? 50),
    conditions: conditionLabel(weather.id, weather.main),
    windSpeedMs: Number(data.wind?.speed ?? 0),
    simulated: false,
  };
};

export const getStadiumWeatherCached = async (prisma, stadium, apiKey, { force = false } = {}) => {
  if (!force) {
    const cached = await prisma.stadiumWeatherCache.findUnique({
      where: { stadiumId: stadium.id },
    });
    if (cached && isCacheFresh(cached.fetchedAt)) {
      return mapWeatherData(cached);
    }
  }

  const weather = await fetchStadiumWeatherFromApi(
    Number(stadium.latitude),
    Number(stadium.longitude),
    apiKey,
  );

  const row = await prisma.stadiumWeatherCache.upsert({
    where: { stadiumId: stadium.id },
    create: {
      stadiumId: stadium.id,
      temperatureC: weather.temperatureC,
      humidityPct: weather.humidityPct,
      conditions: weather.conditions,
      windSpeedMs: weather.windSpeedMs,
      simulated: weather.simulated,
    },
    update: {
      temperatureC: weather.temperatureC,
      humidityPct: weather.humidityPct,
      conditions: weather.conditions,
      windSpeedMs: weather.windSpeedMs,
      simulated: weather.simulated,
      fetchedAt: new Date(),
    },
  });

  return { ...mapWeatherData(row), fromCache: false };
};

export const refreshAllStadiumWeather = async (prisma, apiKey, { force = false } = {}) => {
  const stadiums = await prisma.stadium.findMany({ orderBy: { id: "asc" } });
  const results = [];

  for (const stadium of stadiums) {
    try {
      const weather = await getStadiumWeatherCached(prisma, stadium, apiKey, { force });
      results.push({ stadium_id: stadium.id, ok: true, simulated: weather.simulated, from_cache: weather.fromCache });
    } catch (err) {
      results.push({ stadium_id: stadium.id, ok: false, error: err?.message || "Error" });
    }
  }

  return { refreshed: results.filter((r) => r.ok).length, total: stadiums.length, results };
};

export const upsertMatchWeather = async (prisma, matchId, weather) => {
  return prisma.matchWeather.upsert({
    where: { matchId },
    create: {
      matchId,
      temperatureC: weather.temperatureC,
      humidityPct: weather.humidityPct,
      conditions: weather.conditions,
      windSpeedMs: weather.windSpeedMs,
    },
    update: {
      temperatureC: weather.temperatureC,
      humidityPct: weather.humidityPct,
      conditions: weather.conditions,
      windSpeedMs: weather.windSpeedMs,
      fetchedAt: weather.fetchedAt || new Date(),
    },
  });
};

/** @deprecated Usar getStadiumWeatherCached */
export const fetchStadiumWeather = fetchStadiumWeatherFromApi;
