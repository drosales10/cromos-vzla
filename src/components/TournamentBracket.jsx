import { useState, useMemo } from "react";
import { useTournamentBracket } from "../hooks/useTournamentBracket";
import MatchNode from "./MatchNode";
import "./bracket.css";

const NODE_W = 196;
const NODE_H = 58;
const COL_GAP = 48;

const unitForRound = (roundIndex) => (roundIndex === 0 ? 34 : roundIndex === 1 ? 30 : 26);

const nodeY = (roundIndex, matchIndex) => {
  const unit = unitForRound(roundIndex);
  const block = 2 ** (roundIndex + 1) * unit;
  return matchIndex * block * 2 + block - NODE_H / 2;
};

const nodeX = (roundIndex) => roundIndex * (NODE_W + COL_GAP);

const buildConnections = (rounds, showPredictedPath = true) => {
  const paths = [];
  rounds.forEach((round, roundIndex) => {
    if (roundIndex >= rounds.length - 1) return;
    const nextRound = rounds[roundIndex + 1];
    round.nodes.forEach((node, matchIndex) => {
      const parent = nextRound.nodes[Math.floor(matchIndex / 2)];
      if (!parent) return;
      const x1 = nodeX(roundIndex) + NODE_W;
      const y1 = nodeY(roundIndex, matchIndex) + NODE_H / 2;
      const x2 = nodeX(roundIndex + 1);
      const y2 = nodeY(roundIndex + 1, Math.floor(matchIndex / 2)) + NODE_H / 2;
      const midX = x1 + COL_GAP / 2;
      const active = node.has_winner || (showPredictedPath && node.has_predicted_winner);
      const d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
      paths.push({
        id: `${node.bracket_slot}->${parent.bracket_slot}`,
        d,
        active,
        from: node.bracket_slot,
        to: parent.bracket_slot,
        teamIds: [node.home?.id, node.away?.id, node.winner_id, node.predicted_winner_id]
          .filter((id) => id && id !== "TBD"),
      });
    });
  });
  return paths;
};

const teamInNode = (node, teamId, showPredictedPath = true) => {
  if (!teamId || !node) return false;
  return node.home?.id === teamId
    || node.away?.id === teamId
    || node.winner_id === teamId
    || (showPredictedPath && node.predicted_winner_id === teamId);
};

const resolveBracketView = (bracket, viewMode) => {
  const nodes = bracket?.nodes_by_mode?.[viewMode] || bracket?.nodes || [];
  const rounds = bracket?.rounds_by_mode?.[viewMode]
    || bracket?.rounds
    || [];
  return { nodes, rounds };
};

export default function TournamentBracket() {
  const [viewMode, setViewMode] = useState("predicted");
  const { bracket, loading, error, refresh } = useTournamentBracket();
  const [hoveredTeamId, setHoveredTeamId] = useState(null);
  const [mobilePhase, setMobilePhase] = useState(0);

  const isPredictedView = viewMode === "predicted";
  const { nodes, rounds } = useMemo(
    () => resolveBracketView(bracket, viewMode),
    [bracket, viewMode],
  );

  const knockoutState = bracket?.knockout_state;
  const nodeBySlot = useMemo(
    () => new Map(nodes.map((n) => [n.bracket_slot, n])),
    [nodes],
  );
  const paths = useMemo(
    () => buildConnections(rounds, isPredictedView),
    [rounds, isPredictedView],
  );

  const canvasHeight = useMemo(() => {
    if (!rounds.length) return 400;
    const first = rounds[0];
    if (!first?.nodes?.length) return 400;
    return nodeY(0, first.nodes.length - 1) + NODE_H + 48;
  }, [rounds]);

  const canvasWidth = rounds.length * (NODE_W + COL_GAP);

  if (loading) {
    return <div className="bracket-shell bracket-loading">Cargando árbol del torneo…</div>;
  }

  if (error) {
    return (
      <div className="bracket-shell bracket-loading">
        <div style={{ color: "#f85149", marginBottom: 12 }}>{error}</div>
        <button className="btn btn-sm" onClick={refresh}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="bracket-shell">
      <div className="bracket-toolbar">
        <div>
          <div className="bracket-title">Árbol de Eliminación Directa</div>
          <div className="bracket-subtitle">
            {isPredictedView
              ? "Cada tarjeta muestra tus predicciones y el camino proyectado"
              : "Cada tarjeta muestra solo equipos y resultados confirmados"}
          </div>
        </div>
        <div className="bracket-toolbar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={refresh}>↻</button>
        </div>
      </div>

      {knockoutState && (
        <div className="bracket-phase-status">
          {knockoutState.phase_order.map((phase) => {
            const round = rounds.find((r) => r.phase === phase);
            if (!round) return null;
            const isActive = knockoutState.active_phase === phase;
            const isDone = knockoutState.completed_phases.includes(phase);
            return (
              <span
                key={phase}
                className={`bracket-phase-pill ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
              >
                {round.label}
                {isActive && " · abierta"}
                {isDone && " · ✓"}
              </span>
            );
          })}
        </div>
      )}

      <div className="bracket-phase-tabs">
        {rounds.map((round, i) => {
          const isLocked = knockoutState?.active_phase
            && round.phase !== knockoutState.active_phase
            && !knockoutState.completed_phases.includes(round.phase);
          return (
            <button
              key={round.phase}
              type="button"
              className={`bracket-phase-tab ${mobilePhase === i ? "active" : ""} ${isLocked ? "is-locked" : ""}`}
              onClick={() => setMobilePhase(i)}
            >
              {round.label}
            </button>
          );
        })}
      </div>

      <div className={`bracket-viewport ${isPredictedView ? "is-predicted-view" : "is-real-view"}`}>
        <div className="bracket-tree-toolbar">
          <span className="bracket-tree-toolbar-label">Ver tarjetas del árbol como:</span>
          <div className="bracket-view-toggle" role="group" aria-label="Modo del árbol">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "real" ? "" : "btn-ghost"}`}
              onClick={() => setViewMode("real")}
            >
              Real
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "predicted" ? "" : "btn-ghost"}`}
              onClick={() => setViewMode("predicted")}
            >
              Predicho
            </button>
          </div>
        </div>

        <div className="bracket-canvas" style={{ width: canvasWidth, height: canvasHeight }}>
          <svg className="bracket-svg" width={canvasWidth} height={canvasHeight}>
            <defs>
              <linearGradient id="bracket-glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3ddc97" />
                <stop offset="100%" stopColor="#58a6ff" />
              </linearGradient>
            </defs>
            {paths.map((path) => {
              const fromNode = nodeBySlot.get(path.from);
              const toNode = nodeBySlot.get(path.to);
              const highlighted = hoveredTeamId && (
                teamInNode(fromNode, hoveredTeamId, isPredictedView)
                || teamInNode(toNode, hoveredTeamId, isPredictedView)
              );
              return (
                <path
                  key={path.id}
                  d={path.d}
                  className={`bracket-line-path ${path.active ? "is-active" : ""} ${highlighted ? "is-highlight" : ""}`}
                />
              );
            })}
          </svg>

          <div className="bracket-columns">
            {rounds.map((round, roundIndex) => {
              const phaseLocked = knockoutState?.active_phase
                && round.phase !== knockoutState.active_phase
                && !knockoutState.completed_phases.includes(round.phase);
              return (
                <div
                  key={round.phase}
                  className={`bracket-column ${mobilePhase !== roundIndex ? "is-mobile-hidden" : ""} ${phaseLocked ? "is-phase-locked" : ""}`}
                  style={{ width: NODE_W }}
                >
                  <div className="bracket-column-title">{round.label}</div>
                  <div className="bracket-column-nodes" style={{ height: canvasHeight }}>
                    {round.nodes.map((node, matchIndex) => (
                      <div
                        key={`${viewMode}-${node.bracket_slot}`}
                        className={`bracket-node-slot ${node.can_predict && !node.prediction && isPredictedView ? "needs-prediction" : ""}`}
                        style={{
                          top: nodeY(roundIndex, matchIndex),
                          width: NODE_W,
                          height: NODE_H,
                        }}
                      >
                        <MatchNode
                          node={node}
                          highlighted={hoveredTeamId && teamInNode(node, hoveredTeamId, isPredictedView)}
                          onHoverTeam={setHoveredTeamId}
                          viewMode={viewMode}
                          showPredictions={isPredictedView}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bracket-finals">
        {isPredictedView && bracket?.predicted_champion && !bracket?.champion && (
          <div className="bracket-champion bracket-champion--sim">
            <div className="bracket-champion-label">Tu campeón según predicciones</div>
            <div className="bracket-champion-name">
              {bracket.predicted_champion.flag_emoji} {bracket.predicted_champion.name}
            </div>
          </div>
        )}
        {bracket?.champion && (
          <div className="bracket-champion">
            <div className="bracket-champion-label">🥇 Campeón real</div>
            <div className="bracket-champion-name">
              {bracket.champion.flag_emoji} {bracket.champion.name}
            </div>
          </div>
        )}
        {isPredictedView && bracket?.predicted_champion && bracket?.champion
          && bracket.predicted_champion.id !== bracket.champion.id && (
          <div className="bracket-champion bracket-champion--sim">
            <div className="bracket-champion-label">Tu campeón predicho</div>
            <div className="bracket-champion-name">
              {bracket.predicted_champion.flag_emoji} {bracket.predicted_champion.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
