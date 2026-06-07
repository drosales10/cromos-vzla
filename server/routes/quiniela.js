import { randomBytes } from "node:crypto";
import {
  listMatches,
  getMatchById,
  mapMatchOut,
  refreshMatchTravelDistances,
  syncMatchWeather,
} from "../services/matchesService.js";
import { refreshAllStadiumWeather } from "../services/weatherService.js";
import {
  buildTournamentBracket,
  propagateBracketWinner,
  generateBracketMatches,
  seedGroupStageMatches,
  seedRound32SimulationTeams,
} from "../services/bracketService.js";
import { upsertSimulationPick, clearSimulation } from "../services/simulationService.js";
import {
  upsertPrediction,
  getUserPredictions,
  getMatchAnalysisForUser,
  isPredictionLocked,
} from "../services/predictionsService.js";
import {
  scoreMatchPredictions,
  getLeaderboard,
  syncAlbumPoints,
} from "../services/scoreEngine.js";
import { getTournamentStandings } from "../services/standingsService.js";

const genInviteCode = () => randomBytes(4).toString("hex").toUpperCase();

export const registerQuinielaRoutes = (app, { prisma, requireAuth, requireSuperuser, writeAuditLog, ApiError }) => {
  const weatherApiKey = process.env.OPENWEATHER_API_KEY || "";

  app.get("/api/matches", requireAuth, async (req, res, next) => {
    try {
      const rows = await listMatches(prisma, {
        phase: req.query.phase,
        status: req.query.status,
        from: req.query.from,
        to: req.query.to,
        groupCode: req.query.group,
        date: req.query.date,
      });
      const includeAnalytics = req.query.analytics === "true";
      res.json(rows.map((m) => mapMatchOut(m, { includeAnalytics })));
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/matches/:id", requireAuth, async (req, res, next) => {
    try {
      const match = await getMatchById(prisma, req.params.id);
      if (!match) throw new ApiError(404, "Partido no encontrado");
      res.json(mapMatchOut(match, { includeAnalytics: true }));
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/matches/:id/analysis", requireAuth, async (req, res, next) => {
    try {
      const analysis = await getMatchAnalysisForUser(prisma, req.params.id, req.authUser.id);
      if (!analysis) throw new ApiError(404, "Partido no encontrado");
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/predictions/me", requireAuth, async (req, res, next) => {
    try {
      const matchIds = req.query.match_ids ? String(req.query.match_ids).split(",").filter(Boolean) : undefined;
      const rows = await getUserPredictions(prisma, req.authUser.id, { matchIds });
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/predictions", requireAuth, async (req, res, next) => {
    try {
      const row = await upsertPrediction(prisma, req.authUser.id, {
        match_id: req.body.match_id,
        home_goals: req.body.home_goals,
        away_goals: req.body.away_goals,
      });
      res.status(201).json(row);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.get("/api/leaderboard", requireAuth, async (req, res, next) => {
    try {
      await syncAlbumPoints(prisma, req.authUser.id);
      const rows = await getLeaderboard(prisma, {
        leagueId: req.query.league_id,
        limit: Number(req.query.limit || 50),
      });
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/standings", requireAuth, async (req, res, next) => {
    try {
      const data = await getTournamentStandings(prisma, {
        phase: req.query.phase || "GROUP",
        group: req.query.group,
        mode: req.query.mode,
        userId: req.authUser.id,
      });
      res.json(data);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.get("/api/leagues/mine", requireAuth, async (req, res, next) => {
    try {
      const memberships = await prisma.privateLeagueMember.findMany({
        where: { userId: req.authUser.id },
        include: { league: { include: { owner: { select: { id: true, username: true, name: true } } } } },
      });
      res.json(memberships.map((m) => ({
        id: m.league.id,
        name: m.league.name,
        invite_code: m.league.inviteCode,
        owner: { id: m.league.owner.id, username: m.league.owner.username, name: m.league.owner.name },
        joined_at: m.joinedAt,
        is_owner: m.league.ownerId === req.authUser.id,
      })));
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/leagues", requireAuth, async (req, res, next) => {
    try {
      const name = String(req.body.name || "").trim().slice(0, 80);
      if (!name) throw new ApiError(400, "Nombre de liga requerido");

      const league = await prisma.$transaction(async (tx) => {
        const created = await tx.privateLeague.create({
          data: {
            name,
            inviteCode: genInviteCode(),
            ownerId: req.authUser.id,
          },
        });
        await tx.privateLeagueMember.create({
          data: { leagueId: created.id, userId: req.authUser.id },
        });
        return created;
      });

      res.status(201).json({
        id: league.id,
        name: league.name,
        invite_code: league.inviteCode,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/leagues/join", requireAuth, async (req, res, next) => {
    try {
      const code = String(req.body.invite_code || "").trim().toUpperCase();
      if (!code) throw new ApiError(400, "Código de invitación requerido");

      const league = await prisma.privateLeague.findUnique({ where: { inviteCode: code } });
      if (!league) throw new ApiError(404, "Liga no encontrada");

      await prisma.privateLeagueMember.upsert({
        where: { leagueId_userId: { leagueId: league.id, userId: req.authUser.id } },
        create: { leagueId: league.id, userId: req.authUser.id },
        update: {},
      });

      res.json({ id: league.id, name: league.name, invite_code: league.inviteCode });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/simulation/pick", requireAuth, async (req, res, next) => {
    try {
      const row = await upsertSimulationPick(prisma, req.authUser.id, {
        bracket_slot: req.body.bracket_slot,
        predicted_winner_team_id: req.body.predicted_winner_team_id,
        predicted_home_goals: req.body.predicted_home_goals,
        predicted_away_goals: req.body.predicted_away_goals,
      });
      res.json(row);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.delete("/api/simulation", requireAuth, async (req, res, next) => {
    try {
      const result = await clearSimulation(prisma, req.authUser.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/bracket", requireAuth, async (req, res, next) => {
    try {
      const data = await buildTournamentBracket(prisma, req.authUser.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/matches/bracket/:phase", requireAuth, async (req, res, next) => {
    try {
      const phase = String(req.params.phase || "").toUpperCase();
      const valid = ["ROUND_32", "ROUND_16", "QUARTER", "SEMI", "FINAL", "THIRD_PLACE"];
      if (!valid.includes(phase)) throw new ApiError(400, "Fase inválida");

      const rows = await listMatches(prisma, { phase });
      const locked = rows.some((m) => m.homeTeamId === "TBD" || m.awayTeamId === "TBD");
      res.json({
        phase,
        matches: rows.map((m) => mapMatchOut(m)),
        predictions_locked: locked || rows.some((m) => isPredictionLocked(m.kickoffAt)),
      });
    } catch (err) {
      next(err);
    }
  });

  // ─── Admin ───────────────────────────────────────────────────────────────

  app.get("/api/admin/teams", requireAuth, requireSuperuser, async (_req, res, next) => {
    try {
      const rows = await prisma.team.findMany({ orderBy: { name: "asc" } });
      res.json(rows.map((t) => ({
        id: t.id,
        name: t.name,
        flag_emoji: t.flagEmoji,
        fifa_ranking: t.fifaRanking,
      })));
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/stadiums", requireAuth, requireSuperuser, async (_req, res, next) => {
    try {
      const rows = await prisma.stadium.findMany({ orderBy: [{ country: "asc" }, { city: "asc" }] });
      res.json(rows.map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city,
        country: s.country,
      })));
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/matches", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const rows = await listMatches(prisma, {
        phase: req.query.phase,
        status: req.query.status,
        groupCode: req.query.group,
        date: req.query.date,
      });
      res.json(rows.map((m) => mapMatchOut(m, { includeAnalytics: true })));
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/matches", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const data = {
        homeTeamId: req.body.home_team_id,
        awayTeamId: req.body.away_team_id,
        stadiumId: req.body.stadium_id,
        kickoffAt: new Date(req.body.kickoff_at),
        status: req.body.status || "SCHEDULED",
        phase: req.body.phase || "GROUP",
        groupCode: req.body.group_code || null,
        homeScore: req.body.home_score ?? null,
        awayScore: req.body.away_score ?? null,
        bracketSlot: req.body.bracket_slot || null,
        feederHomeSlot: req.body.feeder_home_slot || null,
        feederAwaySlot: req.body.feeder_away_slot || null,
        bracketOrder: req.body.bracket_order != null ? Number(req.body.bracket_order) : null,
      };

      let match = await prisma.match.create({ data, include: { homeTeam: true, awayTeam: true, stadium: true, weather: true } });
      match = await refreshMatchTravelDistances(prisma, match.id);
      if (weatherApiKey || req.body.sync_weather) {
        match = await syncMatchWeather(prisma, match.id, weatherApiKey);
      }

      await writeAuditLog({
        actorId: req.authUser.id,
        action: "MATCH_CREATED",
        targetType: "match",
        targetId: match.id,
        details: data,
      });

      res.status(201).json(mapMatchOut(match, { includeAnalytics: true }));
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/admin/matches/:id", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const prev = await prisma.match.findUnique({ where: { id: req.params.id } });
      if (!prev) throw new ApiError(404, "Partido no encontrado");

      const data = {};
      if (req.body.status) data.status = req.body.status;
      if (req.body.phase) data.phase = req.body.phase;
      if (req.body.group_code !== undefined) data.groupCode = req.body.group_code || null;
      if (req.body.home_team_id) data.homeTeamId = req.body.home_team_id;
      if (req.body.away_team_id) data.awayTeamId = req.body.away_team_id;
      if (req.body.stadium_id) data.stadiumId = req.body.stadium_id;
      if (req.body.home_score !== undefined) data.homeScore = req.body.home_score;
      if (req.body.away_score !== undefined) data.awayScore = req.body.away_score;
      if (req.body.kickoff_at) data.kickoffAt = new Date(req.body.kickoff_at);

      let match = await prisma.match.update({
        where: { id: req.params.id },
        data,
        include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
      });

      if (req.body.home_team_id || req.body.away_team_id || req.body.stadium_id || req.body.kickoff_at) {
        match = await refreshMatchTravelDistances(prisma, match.id);
      }

      if (req.body.sync_weather) {
        match = await syncMatchWeather(prisma, match.id, weatherApiKey);
      }

      if (data.status === "FINISHED" && prev.status !== "FINISHED") {
        await scoreMatchPredictions(prisma, match.id);
        match = await prisma.match.findUnique({
          where: { id: match.id },
          include: { homeTeam: true, awayTeam: true, stadium: true, weather: true },
        });
        await propagateBracketWinner(prisma, match);
      }

      await writeAuditLog({
        actorId: req.authUser.id,
        action: "MATCH_UPDATED",
        targetType: "match",
        targetId: match.id,
        details: data,
      });

      res.json(mapMatchOut(match, { includeAnalytics: true }));
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.post("/api/admin/matches/:id/weather", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const force = req.query.force === "true" || req.body?.force === true;
      const match = await syncMatchWeather(prisma, req.params.id, weatherApiKey, { force });
      if (!match) throw new ApiError(404, "Partido no encontrado");
      res.json(mapMatchOut(match, { includeAnalytics: true }));
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/groups/seed", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const replace = req.body?.replace === true || req.query.replace === "true";
      const result = await seedGroupStageMatches(prisma, { replace });
      await writeAuditLog({
        actorId: req.authUser.id,
        action: "GROUP_MATCHES_SEEDED",
        targetType: "matches",
        targetId: null,
        details: result,
      });
      res.status(result.created_count > 0 ? 201 : 200).json(result);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.post("/api/admin/bracket/seed-r32", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const resetResults = req.body?.reset_results !== false;

      const result = await seedRound32SimulationTeams(prisma, { resetResults });

      if (result.missing_slots.length > 0) {
        throw new ApiError(
          400,
          `Faltan llaves R32 (${result.missing_slots.join(", ")}). Generá las 31 llaves primero.`,
        );
      }

      await writeAuditLog({
        actorId: req.authUser.id,
        action: "R32_SIMULATION_SEEDED",
        targetType: "bracket",
        targetId: null,
        details: result,
      });

      res.json(result);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.post("/api/admin/bracket/generate", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const replace = req.body?.replace === true || req.query.replace === "true";
      const syncWeather = req.body?.sync_weather === true || req.query.sync_weather === "true";

      const result = await generateBracketMatches(prisma, {
        replace,
        syncSchedule: true,
        syncWeather,
        weatherApiKey,
      });

      await writeAuditLog({
        actorId: req.authUser.id,
        action: "BRACKET_GENERATED",
        targetType: "bracket",
        targetId: null,
        details: { replace, created_count: result.created_count, deleted_count: result.deleted_count },
      });

      res.status(result.created_count > 0 ? 201 : 200).json(result);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });

  app.post("/api/admin/weather/refresh-stadiums", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const force = req.query.force === "true" || req.body?.force === true;
      const result = await refreshAllStadiumWeather(prisma, weatherApiKey, { force });
      await writeAuditLog({
        actorId: req.authUser.id,
        action: "WEATHER_STADIUMS_REFRESHED",
        targetType: "weather",
        targetId: null,
        details: { force, ...result },
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/matches/:id/score-predictions", requireAuth, requireSuperuser, async (req, res, next) => {
    try {
      const result = await scoreMatchPredictions(prisma, req.params.id);
      res.json(result);
    } catch (err) {
      if (err.status) return next(new ApiError(err.status, err.message));
      next(err);
    }
  });
};
