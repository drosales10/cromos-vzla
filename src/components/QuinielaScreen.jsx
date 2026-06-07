import { useState, useMemo, useEffect } from "react";
import { api } from "../api";
import { useMatches } from "../hooks/useMatches";
import { usePredictions } from "../hooks/usePredictions";
import { useLeaderboard } from "../hooks/useLeaderboard";
import TournamentBracket from "./TournamentBracket";
import TournamentStandings from "./TournamentStandings";

const LOCK_MINUTES = 15;
const GROUP_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const kickoffDayKey = (kickoffAt) => {
  const d = new Date(kickoffAt);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDayLabel = (isoDay) => new Date(`${isoDay}T12:00:00Z`).toLocaleDateString("es-CR", {
  weekday: "short", day: "numeric", month: "short",
});

const isKickoffLocked = (kickoffAt) => {
  const kickoff = new Date(kickoffAt).getTime();
  return Date.now() >= kickoff - LOCK_MINUTES * 60 * 1000;
};

const G = {
  bg: "var(--app-bg)",
  card: "var(--app-card)",
  card2: "var(--app-card-2)",
  accent: "var(--app-accent)",
  accent2: "var(--app-accent-2)",
  accent3: "var(--app-accent-3)",
  danger: "var(--app-danger)",
  text: "var(--app-text)",
  muted: "var(--app-muted)",
  border: "var(--app-border)",
};

function ProgressBar({ label, value, max = 100, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: G.muted, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: G.text, fontWeight: 700 }}>{value}{max === 100 ? "%" : ` km`}</span>
      </div>
      <div style={{ height: 8, background: G.card2, borderRadius: 99, overflow: "hidden", border: `1px solid ${G.border}` }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

const getPredictionOutcome = (pred, match) => {
  if (!pred || match.status !== "FINISHED" || match.home_score == null || match.away_score == null) {
    return null;
  }
  const exact = pred.home_goals === match.home_score && pred.away_goals === match.away_score;
  const predResult = Math.sign(pred.home_goals - pred.away_goals);
  const actualResult = Math.sign(match.home_score - match.away_score);
  const basic = predResult === actualResult;
  return { exact, basic };
};

function MatchCard({ match, prediction, onSave, flash }) {
  const [expanded, setExpanded] = useState(false);
  const [homeGoals, setHomeGoals] = useState(prediction?.home_goals ?? 0);
  const [awayGoals, setAwayGoals] = useState(prediction?.away_goals ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prediction) {
      setHomeGoals(prediction.home_goals);
      setAwayGoals(prediction.away_goals);
    }
  }, [prediction?.id, prediction?.home_goals, prediction?.away_goals]);

  const locked = match.status === "FINISHED"
    || prediction?.locked
    || isKickoffLocked(match.kickoff_at);
  const analytics = match.analytics;
  const kickoff = new Date(match.kickoff_at).toLocaleString("es-CR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  const quickPick = (h, a) => {
    if (locked) return;
    setHomeGoals(h);
    setAwayGoals(a);
  };

  const submit = async () => {
    if (locked) return;
    setSaving(true);
    try {
      await onSave(match.id, homeGoals, awayGoals);
      flash("Predicción guardada");
    } catch (err) {
      flash(err?.message || "No se pudo guardar", true);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = match.status === "FINISHED" ? G.accent3
    : match.status === "LIVE" ? G.danger : G.accent2;
  const outcome = getPredictionOutcome(prediction, match);
  const weather = match.weather;
  const weatherIsSimulated = weather?.simulated ?? /simulado/i.test(weather?.conditions || "");

  return (
    <div style={{
      background: G.card,
      border: `1px solid ${G.border}`,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, color: G.muted }}>
          {match.phase === "GROUP" ? `Grupo ${match.group_code || "—"}` : match.phase.replace("_", " ")}
          {" · "}{kickoff}
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: statusColor, textTransform: "uppercase" }}>
          {match.status}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>{match.home_team.flag_emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>{match.home_team.name}</div>
          {match.status === "FINISHED" && (
            <div style={{ fontSize: 22, fontWeight: 900, color: G.accent, marginTop: 4 }}>{match.home_score}</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number" min={0} max={20} value={homeGoals}
            disabled={locked}
            onChange={(e) => setHomeGoals(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            style={{
              width: 44, textAlign: "center", fontSize: 18, fontWeight: 800,
              background: G.card2, color: G.text, border: `1px solid ${G.border}`,
              borderRadius: 8, padding: "6px 4px",
            }}
          />
          <span style={{ color: G.muted, fontWeight: 700 }}>—</span>
          <input
            type="number" min={0} max={20} value={awayGoals}
            disabled={locked}
            onChange={(e) => setAwayGoals(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
            style={{
              width: 44, textAlign: "center", fontSize: 18, fontWeight: 800,
              background: G.card2, color: G.text, border: `1px solid ${G.border}`,
              borderRadius: 8, padding: "6px 4px",
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>{match.away_team.flag_emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>{match.away_team.name}</div>
          {match.status === "FINISHED" && (
            <div style={{ fontSize: 22, fontWeight: 900, color: G.accent, marginTop: 4 }}>{match.away_score}</div>
          )}
        </div>
      </div>

      {prediction && (
        <div style={{
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 10,
          background: G.card2,
          border: `1px solid ${G.border}`,
          fontSize: 12,
          textAlign: "center",
        }}>
          <div style={{ color: G.text, fontWeight: 700 }}>
            Tu predicción:{" "}
            <span style={{ color: G.accent, fontSize: 15 }}>
              {prediction.home_goals} — {prediction.away_goals}
            </span>
            {prediction.multiplier > 1 && (
              <span style={{ marginLeft: 8, fontSize: 11, color: G.accent3 }}>
                ×{Number(prediction.multiplier).toFixed(2)} álbum
              </span>
            )}
          </div>
          {match.status === "FINISHED" && match.home_score != null && match.away_score != null && (
            <div style={{ marginTop: 6, color: G.muted, fontSize: 11 }}>
              Resultado real:{" "}
              <strong style={{ color: G.text }}>{match.home_score} — {match.away_score}</strong>
              {outcome?.exact && (
                <span style={{ marginLeft: 8, color: G.accent3, fontWeight: 800 }}>✓ Marcador exacto</span>
              )}
              {!outcome?.exact && outcome?.basic && (
                <span style={{ marginLeft: 8, color: G.accent2, fontWeight: 800 }}>✓ Ganador acertado</span>
              )}
              {outcome && !outcome.exact && !outcome.basic && (
                <span style={{ marginLeft: 8, color: G.danger, fontWeight: 800 }}>✗ No acertaste</span>
              )}
            </div>
          )}
        </div>
      )}

      {!locked && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
          {[[1, 0], [0, 0], [0, 1], [2, 1], [1, 2]].map(([h, a]) => (
            <button key={`${h}-${a}`} className="btn btn-ghost btn-sm" onClick={() => quickPick(h, a)}>
              {h}-{a}
            </button>
          ))}
          <button className="btn btn-sm" onClick={submit} disabled={saving}>
            {saving ? "..." : prediction ? "Actualizar" : "Predecir"}
          </button>
        </div>
      )}

      {prediction?.points_earned > 0 && (
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: G.accent3 }}>
          +{prediction.points_earned} pts · +{prediction.coins_earned} monedas
          {prediction.special_pack_awarded && " · Sobre especial"}
        </div>
      )}

      {locked && match.status === "SCHEDULED" && (
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: G.danger }}>
          Predicciones cerradas (15 min antes del pitazo)
        </div>
      )}

      <button
        className="btn btn-ghost btn-sm"
        style={{ width: "100%", marginTop: 12 }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "▲ Ocultar análisis" : "▼ Analizar Match"}
      </button>

      {expanded && analytics && (
        <div style={{ marginTop: 14, padding: 14, background: G.card2, borderRadius: 10, border: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: G.muted }}>
              📍 {match.stadium?.name} · {match.stadium?.city}
              {weather && ` · ${weather.conditions} ${weather.temperature_c}°C`}
              {weather?.humidity_pct != null && ` · ${weather.humidity_pct}% humedad`}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              padding: "4px 8px",
              borderRadius: 6,
              flexShrink: 0,
              color: weather
                ? (weatherIsSimulated ? "var(--app-muted)" : G.accent3)
                : G.danger,
              background: weather
                ? (weatherIsSimulated
                  ? "color-mix(in srgb, var(--app-muted) 18%, transparent)"
                  : "color-mix(in srgb, var(--app-accent-3) 18%, transparent)")
                : "color-mix(in srgb, var(--app-danger) 15%, transparent)",
              border: `1px solid ${weather
                ? (weatherIsSimulated ? G.border : `${G.accent3}55`)
                : `${G.danger}44`}`,
            }}>
              {weather
                ? (weatherIsSimulated ? "🌤 Clima simulado" : "🌦 Clima OpenWeather")
                : "⚠ Sin clima"}
            </span>
          </div>
          {weatherIsSimulated && weather && (
            <div style={{ fontSize: 10, color: G.muted, marginBottom: 10, lineHeight: 1.4 }}>
              Sin API key activa o datos de respaldo. El análisis climático es orientativo.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {["home", "away"].map((side) => {
              const team = side === "home" ? match.home_team : match.away_team;
              const data = analytics[side];
              return (
                <div key={side}>
                  <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8, color: G.accent }}>
                    {team.flag_emoji} {team.name}
                  </div>
                  <ProgressBar label="Confort climático" value={data.climate_comfort} color={G.accent2} />
                  <ProgressBar label="Índice de fatiga" value={data.fatigue_index} color={G.danger} />
                  <ProgressBar label="Km acumulados" value={data.travel_km} max={8000} color={G.accent} />
                  <ProgressBar label="Poder de plantilla" value={data.squad_power} color={G.accent3} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuinielaScreen({ user }) {
  const [view, setView] = useState("fixtures");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [availableDays, setAvailableDays] = useState([]);
  const [leagueId, setLeagueId] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [msg, setMsg] = useState(null);
  const [leagueName, setLeagueName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const showGroupFilter = !phaseFilter || phaseFilter === "GROUP";

  const { matches, loading: matchesLoading, refresh: refreshMatches } = useMatches({
    phase: phaseFilter || undefined,
    group: showGroupFilter && groupFilter ? groupFilter : undefined,
    date: dayFilter || undefined,
  });

  useEffect(() => {
    if (dayFilter) return;
    const days = [...new Set(matches.map((m) => kickoffDayKey(m.kickoff_at)))].sort();
    setAvailableDays(days);
  }, [matches, dayFilter, phaseFilter, groupFilter]);

  const handlePhaseFilter = (phase) => {
    setPhaseFilter(phase);
    if (phase && phase !== "GROUP") setGroupFilter("");
  };
  const matchIds = useMemo(() => matches.map((m) => m.id), [matches]);
  const { predictions, savePrediction, refresh: refreshPredictions } = usePredictions(matchIds);
  const { rows: leaderboard, loading: lbLoading, refresh: refreshLb } = useLeaderboard(leagueId);

  const predMap = useMemo(() => {
    const m = {};
    predictions.forEach((p) => { m[p.match_id] = p; });
    return m;
  }, [predictions]);

  const flash = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 3000);
  };

  const loadLeagues = async () => {
    try {
      const rows = await api.listMyLeagues();
      setLeagues(rows || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadLeagues(); }, []);

  const handleSave = async (matchId, home, away) => {
    await savePrediction(matchId, home, away);
    refreshLb();
  };

  const createLeague = async () => {
    if (!leagueName.trim()) return;
    try {
      await api.createLeague({ name: leagueName.trim() });
      setLeagueName("");
      await loadLeagues();
      flash("Liga creada");
    } catch (err) {
      flash(err?.message || "Error", true);
    }
  };

  const joinLeague = async () => {
    if (!inviteCode.trim()) return;
    try {
      const league = await api.joinLeague(inviteCode.trim());
      setInviteCode("");
      await loadLeagues();
      setLeagueId(league.id);
      flash(`Te uniste a ${league.name}`);
    } catch (err) {
      flash(err?.message || "Código inválido", true);
    }
  };

  const VIEWS = [
    { id: "fixtures", label: "Partidos" },
    { id: "standings", label: "Posiciones" },
    { id: "leaderboard", label: "Ranking" },
    { id: "leagues", label: "Ligas" },
    { id: "bracket", label: "Eliminatoria" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 className="h1" style={{ fontSize: 20, marginBottom: 4 }}>Quiniela Inteligente</h2>
        <p style={{ fontSize: 13, color: G.muted, margin: 0 }}>
          Analizá clima, viajes y plantillas · Ganá puntos y monedas · Multiplicá con tu colección
        </p>
      </div>

      {msg && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13,
          background: msg.isError ? "rgba(200,76,76,.15)" : "rgba(76,200,122,.15)",
          color: msg.isError ? G.danger : G.accent3,
          border: `1px solid ${msg.isError ? G.danger : G.accent3}`,
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {VIEWS.map((v) => (
          <div
            key={v.id}
            className={`nav-item ${view === v.id ? "active" : ""}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={() => { refreshMatches(); refreshPredictions(); refreshLb(); }}>
          ↻ Actualizar
        </button>
      </div>

      {view === "fixtures" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginRight: 4 }}>Fase</span>
            {["", "GROUP", "ROUND_16", "QUARTER", "SEMI", "FINAL"].map((p) => (
              <button
                key={p || "all"}
                className={`btn btn-sm ${phaseFilter === p ? "" : "btn-ghost"}`}
                onClick={() => handlePhaseFilter(p)}
              >
                {p === "" ? "Todos" : p === "GROUP" ? "Grupos" : p.replace("_", " ")}
              </button>
            ))}
          </div>

          {showGroupFilter && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: G.muted, fontWeight: 700, marginRight: 4 }}>Grupo</span>
              <button
                className={`btn btn-sm ${!groupFilter ? "" : "btn-ghost"}`}
                onClick={() => setGroupFilter("")}
              >
                Todos
              </button>
              {GROUP_CODES.map((g) => (
                <button
                  key={g}
                  className={`btn btn-sm ${groupFilter === g ? "" : "btn-ghost"}`}
                  onClick={() => setGroupFilter(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div style={{
            display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center",
          }}>
            <span style={{ fontSize: 11, color: G.muted, fontWeight: 700 }}>Día</span>
            <button
              className={`btn btn-sm ${!dayFilter ? "" : "btn-ghost"}`}
              onClick={() => setDayFilter("")}
            >
              Todos
            </button>
            {availableDays.map((d) => (
              <button
                key={d}
                className={`btn btn-sm ${dayFilter === d ? "" : "btn-ghost"}`}
                onClick={() => setDayFilter(d)}
              >
                {formatDayLabel(d)}
              </button>
            ))}
            <input
              type="date"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 12,
                background: G.card2, color: G.text, border: `1px solid ${G.border}`,
                colorScheme: "dark",
              }}
              aria-label="Filtrar por fecha"
            />
          </div>

          {(groupFilter || dayFilter) && (
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 12 }}>
              {matches.length} partido{matches.length === 1 ? "" : "s"}
              {groupFilter ? ` · Grupo ${groupFilter}` : ""}
              {dayFilter ? ` · ${formatDayLabel(dayFilter)}` : ""}
            </div>
          )}

          {matchesLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: G.muted }}>Cargando partidos...</div>
          ) : matches.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: G.muted }}>
              No hay partidos programados. El admin puede cargarlos desde el panel.
            </div>
          ) : (
            matches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predMap[m.id]}
                onSave={handleSave}
                flash={flash}
              />
            ))
          )}
        </>
      )}

      {view === "standings" && (
        <TournamentStandings />
      )}

      {view === "leaderboard" && (
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, overflow: "hidden" }}>
          {leagues.length > 0 && (
            <div style={{ padding: 12, borderBottom: `1px solid ${G.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className={`btn btn-sm ${!leagueId ? "" : "btn-ghost"}`} onClick={() => setLeagueId(null)}>Global</button>
              {leagues.map((l) => (
                <button
                  key={l.id}
                  className={`btn btn-sm ${leagueId === l.id ? "" : "btn-ghost"}`}
                  onClick={() => setLeagueId(l.id)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
          {lbLoading ? (
            <div style={{ padding: 30, textAlign: "center", color: G.muted }}>Cargando...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: G.card2, color: G.muted, fontSize: 11, textTransform: "uppercase" }}>
                  <th style={{ padding: 10, textAlign: "left" }}>#</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Usuario</th>
                  <th style={{ padding: 10, textAlign: "right" }}>Álbum</th>
                  <th style={{ padding: 10, textAlign: "right" }}>Trueques</th>
                  <th style={{ padding: 10, textAlign: "right" }}>Quiniela</th>
                  <th style={{ padding: 10, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.user_id} style={{ borderTop: `1px solid ${G.border}` }}>
                    <td style={{ padding: 10, color: G.muted }}>{i + 1}</td>
                    <td style={{ padding: 10, fontWeight: 700 }}>
                      {row.user_id === user.id ? "Tú · " : ""}{row.name}
                    </td>
                    <td style={{ padding: 10, textAlign: "right", color: G.accent2 }}>{row.album_points}</td>
                    <td style={{ padding: 10, textAlign: "right", color: G.accent3 }}>{row.trade_points}</td>
                    <td style={{ padding: 10, textAlign: "right", color: G.accent }}>{row.quiniela_points}</td>
                    <td style={{ padding: 10, textAlign: "right", fontWeight: 900 }}>{row.total_points}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: G.muted }}>Sin puntuaciones aún</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {view === "leagues" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Crear liga privada</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Nombre de la liga"
                style={{
                  flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 8,
                  background: G.card2, color: G.text, border: `1px solid ${G.border}`,
                }}
              />
              <button className="btn" onClick={createLeague}>Crear</button>
            </div>
          </div>
          <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Unirse con código</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Código de invitación"
                style={{
                  flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 8,
                  background: G.card2, color: G.text, border: `1px solid ${G.border}`,
                  letterSpacing: 2, fontWeight: 700,
                }}
              />
              <button className="btn" onClick={joinLeague}>Unirse</button>
            </div>
          </div>
          {leagues.map((l) => (
            <div key={l.id} style={{
              background: G.card2, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
            }}>
              <div>
                <div style={{ fontWeight: 800 }}>{l.name}</div>
                <div style={{ fontSize: 11, color: G.muted }}>Código: <span style={{ color: G.accent, letterSpacing: 2 }}>{l.invite_code}</span></div>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => { setLeagueId(l.id); setView("leaderboard"); }}>
                Ver ranking
              </button>
            </div>
          ))}
        </div>
      )}

      {view === "bracket" && (
        <TournamentBracket />
      )}
    </div>
  );
}
