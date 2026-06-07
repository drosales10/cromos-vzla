import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

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

const PHASES = [
  { value: "GROUP", label: "Fase de grupos" },
  { value: "ROUND_32", label: "Dieciseisavos" },
  { value: "ROUND_16", label: "Octavos" },
  { value: "QUARTER", label: "Cuartos" },
  { value: "SEMI", label: "Semifinal" },
  { value: "THIRD_PLACE", label: "Tercer puesto" },
  { value: "FINAL", label: "Final" },
];

const STATUSES = [
  { value: "SCHEDULED", label: "Programado" },
  { value: "LIVE", label: "En vivo" },
  { value: "FINISHED", label: "Finalizado" },
];

const EMPTY_FORM = {
  home_team_id: "",
  away_team_id: "",
  stadium_id: "",
  kickoff_at: "",
  phase: "GROUP",
  group_code: "",
  status: "SCHEDULED",
  home_score: "",
  away_score: "",
  sync_weather: true,
  bracket_slot: "",
  feeder_home_slot: "",
  feeder_away_slot: "",
  bracket_order: "",
};

const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const statusColor = (status) => {
  if (status === "FINISHED") return G.accent3;
  if (status === "LIVE") return G.danger;
  return G.accent2;
};

export default function AdminMatchesPanel({ flash }) {
  const [teams, setTeams] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPhase, setFilterPhase] = useState("");
  const [generatingBracket, setGeneratingBracket] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, stadiumsRes, matchesRes] = await Promise.all([
        api.listAdminTeams(),
        api.listAdminStadiums(),
        api.listAdminMatches({
          status: filterStatus || undefined,
          phase: filterPhase || undefined,
        }),
      ]);
      setTeams(teamsRes || []);
      setStadiums(stadiumsRes || []);
      setMatches(matchesRes || []);
    } catch (err) {
      flash(err?.message || "Error al cargar partidos", true);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPhase]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
  };

  const editMatch = (m) => {
    setEditingId(m.id);
    setForm({
      home_team_id: m.home_team.id,
      away_team_id: m.away_team.id,
      stadium_id: m.stadium.id,
      kickoff_at: toDatetimeLocal(m.kickoff_at),
      phase: m.phase,
      group_code: m.group_code || "",
      status: m.status,
      home_score: m.home_score ?? "",
      away_score: m.away_score ?? "",
      sync_weather: false,
      bracket_slot: m.bracket_slot || "",
      feeder_home_slot: m.feeder_home_slot || "",
      feeder_away_slot: m.feeder_away_slot || "",
      bracket_order: m.bracket_order ?? "",
    });
  };

  const buildPayload = () => ({
    home_team_id: form.home_team_id,
    away_team_id: form.away_team_id,
    stadium_id: form.stadium_id,
    kickoff_at: form.kickoff_at ? new Date(form.kickoff_at).toISOString() : undefined,
    phase: form.phase,
    group_code: form.group_code || null,
    status: form.status,
    home_score: form.home_score === "" ? null : Number(form.home_score),
    away_score: form.away_score === "" ? null : Number(form.away_score),
    sync_weather: form.sync_weather,
    bracket_slot: form.bracket_slot || null,
    feeder_home_slot: form.feeder_home_slot || null,
    feeder_away_slot: form.feeder_away_slot || null,
    bracket_order: form.bracket_order === "" ? null : Number(form.bracket_order),
  });

  const save = async () => {
    if (!form.home_team_id || !form.away_team_id || !form.stadium_id || !form.kickoff_at) {
      flash("Completá local, visitante, estadio y fecha", true);
      return;
    }
    if (form.home_team_id === form.away_team_id) {
      flash("Local y visitante deben ser distintos", true);
      return;
    }
    if (form.status === "FINISHED" && (form.home_score === "" || form.away_score === "")) {
      flash("Ingresá el marcador final", true);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.updateAdminMatch(editingId, payload);
        flash("Partido actualizado");
      } else {
        await api.createAdminMatch(payload);
        flash("Partido creado");
      }
      resetForm();
      await load();
    } catch (err) {
      flash(err?.message || "No se pudo guardar", true);
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (match, status) => {
    try {
      const payload = { status };
      if (status === "FINISHED") {
        const home = prompt("Goles local:", String(match.home_score ?? 0));
        const away = prompt("Goles visitante:", String(match.away_score ?? 0));
        if (home === null || away === null) return;
        payload.home_score = Number(home);
        payload.away_score = Number(away);
      }
      await api.updateAdminMatch(match.id, payload);
      flash(status === "FINISHED" ? "Partido finalizado y quiniela puntuada" : "Estado actualizado");
      await load();
    } catch (err) {
      flash(err?.message || "Error", true);
    }
  };

  const syncWeather = async (id, force = false) => {
    try {
      await api.syncAdminMatchWeather(id, force);
      flash(force ? "Clima forzado desde API" : "Clima sincronizado (caché diaria)");
      await load();
    } catch (err) {
      flash(err?.message || "Error al sincronizar clima", true);
    }
  };

  const refreshAllStadiums = async (force = false) => {
    try {
      const result = await api.refreshAdminStadiumWeather(force);
      flash(`Clima: ${result.refreshed}/${result.total} estadios${force ? " (forzado)" : ""}`);
      await load();
    } catch (err) {
      flash(err?.message || "Error al actualizar estadios", true);
    }
  };

  const generateBracket = async (replace = false) => {
    if (replace) {
      const ok = window.confirm(
        "¿Regenerar las 31 llaves? Se eliminarán todos los partidos de eliminación existentes (predicciones incluidas) y se crearán de nuevo con equipos TBD.",
      );
      if (!ok) return;
    }

    setGeneratingBracket(true);
    try {
      const result = await api.generateAdminBracket({ replace });
      if (result.created_count === 0) {
        flash(`Las ${result.total_slots} llaves ya existen. Usá «Regenerar» si querés empezar de cero.`);
      } else if (result.skipped_count > 0) {
        flash(`Llaves: ${result.created_count} creadas, ${result.skipped_count} ya existían (${result.total_slots} total)`);
      } else {
        flash(`¡Listo! ${result.created_count} llaves generadas (dieciseisavos → final)`);
      }
      await load();
    } catch (err) {
      flash(err?.message || "No se pudo generar el bracket", true);
    } finally {
      setGeneratingBracket(false);
    }
  };

  return (
    <div className="ani" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <div className="h1" style={{ fontSize: 16, letterSpacing: 2 }}>
            {editingId ? "EDITAR PARTIDO" : "CREAR PARTIDO"}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={resetForm}>↺ Limpiar</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="input" value={form.home_team_id}
            onChange={(e) => setForm((p) => ({ ...p, home_team_id: e.target.value }))}>
            <option value="">Local</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.flag_emoji} {t.name}</option>
            ))}
          </select>
          <select className="input" value={form.away_team_id}
            onChange={(e) => setForm((p) => ({ ...p, away_team_id: e.target.value }))}>
            <option value="">Visitante</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.flag_emoji} {t.name}</option>
            ))}
          </select>

          <select className="input" value={form.stadium_id} style={{ gridColumn: "1 / -1" }}
            onChange={(e) => setForm((p) => ({ ...p, stadium_id: e.target.value }))}>
            <option value="">Estadio</option>
            {stadiums.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.city}, {s.country}</option>
            ))}
          </select>

          <input className="input" type="datetime-local" value={form.kickoff_at}
            onChange={(e) => setForm((p) => ({ ...p, kickoff_at: e.target.value }))} />

          <select className="input" value={form.phase}
            onChange={(e) => setForm((p) => ({ ...p, phase: e.target.value }))}>
            {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <input className="input" placeholder="Grupo (ej: A)" value={form.group_code}
            onChange={(e) => setForm((p) => ({ ...p, group_code: e.target.value.toUpperCase() }))} />

          <select className="input" value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <input className="input" type="number" min={0} placeholder="Goles local" value={form.home_score}
            onChange={(e) => setForm((p) => ({ ...p, home_score: e.target.value }))} />
          <input className="input" type="number" min={0} placeholder="Goles visitante" value={form.away_score}
            onChange={(e) => setForm((p) => ({ ...p, away_score: e.target.value }))} />

          <input className="input" placeholder="Slot bracket (R32-01)" value={form.bracket_slot}
            onChange={(e) => setForm((p) => ({ ...p, bracket_slot: e.target.value.toUpperCase() }))} />
          <input className="input" type="number" min={0} placeholder="Orden en fase" value={form.bracket_order}
            onChange={(e) => setForm((p) => ({ ...p, bracket_order: e.target.value }))} />
          <input className="input" placeholder="Feeder local (R32-01)" value={form.feeder_home_slot}
            onChange={(e) => setForm((p) => ({ ...p, feeder_home_slot: e.target.value.toUpperCase() }))} />
          <input className="input" placeholder="Feeder visitante (R32-02)" value={form.feeder_away_slot}
            onChange={(e) => setForm((p) => ({ ...p, feeder_away_slot: e.target.value.toUpperCase() }))} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
          <label style={{ fontSize: 12, color: G.muted, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={form.sync_weather}
              onChange={(e) => setForm((p) => ({ ...p, sync_weather: e.target.checked }))} />
            Sincronizar clima al guardar
          </label>
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}>
            {saving ? "Guardando..." : editingId ? "💾 Guardar cambios" : "➕ Crear partido"}
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: G.muted, lineHeight: 1.5 }}>
          El clima se cachea <strong>24 h por estadio</strong> (máx. 16 llamadas/día al plan gratuito).
          Si la API key es nueva y devuelve <strong>401</strong>, esperá 10 min–2 h.
          Al marcar <strong style={{ color: G.accent3 }}>Finalizado</strong> con marcador, la quiniela se puntúa sola.
        </div>
      </div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <select className="input" value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}>
            <option value="">Fase: todas</option>
            {PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="input" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Estado: todos</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div style={{
          display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap",
          padding: "10px 12px", background: G.card2, borderRadius: 10, border: `1px solid ${G.border}`,
        }}>
          <button
            className="btn btn-sm"
            onClick={async () => {
              const replace = matches.filter((m) => m.phase === "GROUP").length > 0
                && window.confirm("¿Reemplazar partidos de grupos existentes? Se borrarán los de fase de grupos y se crearán los 72 oficiales.");
              try {
                const r = await api.seedAdminGroupMatches(replace);
                flash(r.created_count > 0
                  ? `${r.created_count} partidos de grupos creados (${r.existing} total)`
                  : `Fase de grupos completa (${r.existing}/72 partidos)`);
                await load();
              } catch (err) {
                flash(err?.message || "Error", true);
              }
            }}
            style={{ background: "rgba(76,200,122,.15)", color: G.accent3, border: `1px solid ${G.accent3}44` }}
          >
            📋 Seed 72 grupos
          </button>
          <button
            className="btn btn-sm"
            onClick={async () => {
              try {
                const r = await api.seedAdminR32Simulation(true);
                flash(`Dieciseisavos listos: ${r.teams_seeded} equipos en ${r.updated_count} llaves`);
                await load();
              } catch (err) {
                flash(err?.message || "Error al sembrar R32", true);
              }
            }}
            style={{ background: "rgba(200,160,76,.15)", color: "var(--app-accent)", border: "1px solid color-mix(in srgb, var(--app-accent) 30%, transparent)" }}
          >
            🎲 Sembrar dieciseisavos
          </button>
          <button
            className="btn btn-sm"
            onClick={() => generateBracket(false)}
            disabled={generatingBracket}
            style={{ background: "rgba(76,154,200,.18)", color: G.accent2, border: `1px solid ${G.accent2}44` }}
          >
            {generatingBracket ? "Generando…" : "🏆 Generar 31 llaves"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => generateBracket(true)}
            disabled={generatingBracket}
            title="Borra eliminatoria existente y la recrea"
          >
            ↺ Regenerar
          </button>
          <span style={{ fontSize: 11, color: G.muted, flex: 1, minWidth: 140 }}>
            Generar llaves → Sembrar dieciseisavos (32 equipos) para simular el torneo
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔎 Actualizar lista</button>
          <button className="btn btn-ghost btn-sm" onClick={() => refreshAllStadiums(false)}>🌤️ Caché 16 sedes</button>
          <button className="btn btn-ghost btn-sm" onClick={() => refreshAllStadiums(true)} title="Ignora caché y consulta API">↻ Forzar API</button>
          <span style={{ fontSize: 12, color: G.muted }}>{matches.length} partidos</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflow: "auto", paddingRight: 2 }}>
          {loading ? (
            <div style={{ fontSize: 12, color: G.muted, padding: 20, textAlign: "center" }}>Cargando...</div>
          ) : matches.map((m) => (
            <div key={m.id} className="card2" style={{ padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    {m.home_team.flag_emoji} {m.home_team.name}
                    {" "}
                    {m.status === "FINISHED" ? `${m.home_score} - ${m.away_score}` : "vs"}
                    {" "}
                    {m.away_team.name} {m.away_team.flag_emoji}
                  </div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>
                    {m.stadium.city} · {new Date(m.kickoff_at).toLocaleString("es-CR")}
                    {m.group_code ? ` · Grupo ${m.group_code}` : ` · ${m.phase}`}
                  </div>
                  {m.weather && (
                    <div style={{ fontSize: 10, color: G.accent2, marginTop: 2 }}>
                      {m.weather.conditions} {m.weather.temperature_c}°C · Fatiga L/V: {m.analytics?.home?.fatigue_index ?? "—"}/{m.analytics?.away?.fatigue_index ?? "—"}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: statusColor(m.status), letterSpacing: 1 }}>
                  {m.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <button className="btn btn-sm" onClick={() => editMatch(m)} style={{ background: G.border, color: G.text }}>
                  ✏️ Editar
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => syncWeather(m.id, false)}>🌤️ Clima</button>
                {m.status === "SCHEDULED" && (
                  <button className="btn btn-sm btn-ghost" onClick={() => quickStatus(m, "LIVE")}>▶️ En vivo</button>
                )}
                {m.status !== "FINISHED" && (
                  <button className="btn btn-sm" onClick={() => quickStatus(m, "FINISHED")}
                    style={{ background: "rgba(76,200,122,.15)", color: G.accent3 }}>
                    🏁 Finalizar
                  </button>
                )}
              </div>
            </div>
          ))}
          {!loading && matches.length === 0 && (
            <div style={{ fontSize: 12, color: G.muted }}>No hay partidos. Creá el primero con el formulario.</div>
          )}
        </div>
      </div>
    </div>
  );
}
