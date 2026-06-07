import { useState } from "react";
import { useStandings } from "../hooks/useStandings";
import TeamFlag from "./TeamFlag.jsx";

const G = {
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

const GROUP_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const PHASE_OPTIONS = [
  { value: "GROUP", label: "Grupos" },
  { value: "ROUND_32", label: "Dieciseisavos" },
  { value: "ROUND_16", label: "Octavos" },
  { value: "QUARTER", label: "Cuartos" },
  { value: "SEMI", label: "Semifinal" },
  { value: "THIRD_PLACE", label: "Tercer puesto" },
  { value: "FINAL", label: "Final" },
];

const thStyle = {
  padding: "8px 6px",
  fontSize: 10,
  textTransform: "uppercase",
  color: G.muted,
  fontWeight: 700,
  borderBottom: `1px solid ${G.border}`,
};

const tdStyle = {
  padding: "8px 6px",
  fontSize: 12,
  borderBottom: `1px solid color-mix(in srgb, ${G.border} 70%, transparent)`,
};

function GroupTable({ group, predicted = false }) {
  return (
    <div style={{
      background: G.card,
      border: `1px solid ${G.border}`,
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 12px",
        background: G.card2,
        borderBottom: `1px solid ${G.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: G.text }}>Grupo {group.group_code}</span>
        <span style={{ fontSize: 10, color: G.muted }}>
          {predicted
            ? `${group.matches_counted ?? 0}/${group.matches_total} contados`
            : `${group.matches_finished}/${group.matches_total} jugados`}
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
          <thead>
            <tr style={{ background: G.card2 }}>
              <th style={{ ...thStyle, textAlign: "left", width: 28 }}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Selección</th>
              <th style={{ ...thStyle, textAlign: "center" }}>PJ</th>
              <th style={{ ...thStyle, textAlign: "center" }}>G</th>
              <th style={{ ...thStyle, textAlign: "center" }}>E</th>
              <th style={{ ...thStyle, textAlign: "center" }}>P</th>
              <th style={{ ...thStyle, textAlign: "center" }}>GF</th>
              <th style={{ ...thStyle, textAlign: "center" }}>GC</th>
              <th style={{ ...thStyle, textAlign: "center" }}>DG</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.teams.map((row) => (
              <tr
                key={row.team_id}
                style={{
                  background: row.qualified
                    ? "color-mix(in srgb, var(--app-accent-3) 8%, transparent)"
                    : "transparent",
                }}
              >
                <td style={{ ...tdStyle, color: G.muted, fontWeight: 700 }}>{row.position}</td>
                <td style={{ ...tdStyle, fontWeight: 700, color: G.text, whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <TeamFlag team={row.team} size={18} />
                    {row.team.name}
                  </span>
                  {row.qualified && (
                    <span style={{
                      marginLeft: 6, fontSize: 9, color: G.accent3, fontWeight: 800,
                      border: `1px solid ${G.accent3}44`, borderRadius: 4, padding: "1px 4px",
                    }}>
                      CLAS
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: "center", color: G.muted }}>{row.played}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{row.won}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{row.drawn}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{row.lost}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{row.goals_for}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{row.goals_against}</td>
                <td style={{
                  ...tdStyle,
                  textAlign: "center",
                  color: row.goal_diff > 0 ? G.accent3 : row.goal_diff < 0 ? G.danger : G.muted,
                  fontWeight: 700,
                }}>
                  {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                </td>
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 900, color: G.accent }}>{row.points}</td>
              </tr>
            ))}
            {group.teams.length === 0 && (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: G.muted, padding: 20 }}>
                  Sin equipos en este grupo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KnockoutTable({ data }) {
  return (
    <div style={{
      background: G.card,
      border: `1px solid ${G.border}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 14px",
        background: G.card2,
        borderBottom: `1px solid ${G.border}`,
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span style={{ fontWeight: 800, color: G.text }}>{data.phase_label}</span>
        <span style={{ fontSize: 11, color: G.muted }}>
          {data.matches_finished}/{data.matches_total} partidos con resultado
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: G.card2 }}>
              <th style={{ ...thStyle, textAlign: "left" }}>Llave</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Local</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Marcador</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Visitante</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Avanza</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.matches.map((row) => {
              const score = row.status === "FINISHED" && row.home_score != null
                ? `${row.home_score} — ${row.away_score}`
                : "—";
              return (
                <tr key={row.bracket_slot || `${row.home_team.id}-${row.away_team.id}`}>
                  <td style={{ ...tdStyle, color: G.muted, fontSize: 11 }}>{row.bracket_slot || "—"}</td>
                  <td style={{ ...tdStyle, fontWeight: row.winner_team?.id === row.home_team.id ? 800 : 500, color: G.text }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <TeamFlag team={row.home_team} size={16} />
                      {row.home_team.name}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: 800, color: G.accent }}>{score}</td>
                  <td style={{ ...tdStyle, fontWeight: row.winner_team?.id === row.away_team.id ? 800 : 500, color: G.text }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <TeamFlag team={row.away_team} size={16} />
                      {row.away_team.name}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: G.accent3, fontWeight: 700 }}>
                    {row.winner_team ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <TeamFlag team={row.winner_team} size={16} />
                        {row.winner_team.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{
                    ...tdStyle,
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: row.status === "FINISHED" ? G.accent3 : row.status === "LIVE" ? G.danger : G.muted,
                  }}>
                    {row.status}
                  </td>
                </tr>
              );
            })}
            {data.matches.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: G.muted, padding: 30 }}>
                  No hay partidos cargados para esta fase
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TournamentStandings() {
  const [phase, setPhase] = useState("GROUP");
  const [groupFilter, setGroupFilter] = useState("");
  const [mode, setMode] = useState("real");
  const { data, loading, error, refresh } = useStandings({
    phase,
    group: phase === "GROUP" && groupFilter ? groupFilter : undefined,
    mode: phase === "GROUP" ? mode : "real",
  });

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: G.text, marginBottom: 4 }}>
          {phase === "GROUP" && mode === "predicted"
            ? "Tabla de posiciones (mis predicciones)"
            : "Tabla de posiciones real"}
        </div>
        <div style={{ fontSize: 12, color: G.muted }}>
          {phase === "GROUP" && mode === "predicted"
            ? "Por partido: si ya finalizó usa el resultado real; si no, tu predicción. Los sin predicción no cuentan aún"
            : "Resultados oficiales del torneo según partidos finalizados en la base de datos"}
        </div>
        {data?.summary && (
          <div style={{ fontSize: 11, color: G.accent2, marginTop: 6 }}>
            {data.summary.from_real} partidos reales · {data.summary.from_predictions} predicciones aplicadas
          </div>
        )}
      </div>

      {phase === "GROUP" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === "real" ? "" : "btn-ghost"}`}
            onClick={() => setMode("real")}
          >
            Real
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === "predicted" ? "" : "btn-ghost"}`}
            onClick={() => setMode("predicted")}
          >
            Mis predicciones
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: G.muted, fontWeight: 700 }}>Fase</span>
        {PHASE_OPTIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`btn btn-sm ${phase === p.value ? "" : "btn-ghost"}`}
            onClick={() => {
              setPhase(p.value);
              if (p.value !== "GROUP") setGroupFilter("");
            }}
          >
            {p.label}
          </button>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={refresh}>↻</button>
      </div>

      {phase === "GROUP" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: G.muted, fontWeight: 700 }}>Grupo</span>
          <button
            type="button"
            className={`btn btn-sm ${!groupFilter ? "" : "btn-ghost"}`}
            onClick={() => setGroupFilter("")}
          >
            Todos
          </button>
          {GROUP_CODES.map((g) => (
            <button
              key={g}
              type="button"
              className={`btn btn-sm ${groupFilter === g ? "" : "btn-ghost"}`}
              onClick={() => setGroupFilter(g)}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: G.muted }}>Cargando posiciones…</div>
      )}

      {error && (
        <div style={{
          padding: 14, borderRadius: 10, color: G.danger,
          background: "color-mix(in srgb, var(--app-danger) 12%, transparent)",
          border: `1px solid ${G.danger}44`,
        }}>
          {error}
        </div>
      )}

      {!loading && !error && data?.type === "groups" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 12,
        }}>
          {data.groups.map((group) => (
            <GroupTable key={group.group_code} group={group} predicted={mode === "predicted"} />
          ))}
          {data.groups.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: G.muted }}>
              No hay partidos de grupos cargados. El admin puede usar «Seed 72 grupos».
            </div>
          )}
        </div>
      )}

      {!loading && !error && data?.type === "knockout" && (
        <KnockoutTable data={data} />
      )}
    </div>
  );
}
