import TeamFlag from "./TeamFlag.jsx";

function TeamRow({
  team, score, isWinner, isLoser, isPredictedWinner, isProjectedScore, status, onMouseEnter,
}) {
  const placeholder = team?.is_placeholder;

  return (
    <div
      className={`match-node-team ${isWinner ? "is-winner" : ""} ${isLoser ? "is-loser" : ""} ${placeholder ? "is-placeholder-team" : ""} ${isPredictedWinner ? "is-pred-pick" : ""}`}
      onMouseEnter={onMouseEnter}
    >
      <TeamFlag team={team} size={16} className="match-node-flag" />
      <span className="match-node-name">{team?.name || "Por definir"}</span>
      {team?.album_complete && <span className="match-node-album-dot" title="Colección avanzada en tu álbum" />}
      {score != null && (
        <span className={`match-node-score ${isProjectedScore ? "is-projected" : ""}`}>{score}</span>
      )}
      {isPredictedWinner && !isWinner && (
        <span className="match-node-pred-badge">PRED</span>
      )}
    </div>
  );
}

export default function MatchNode({
  node,
  highlighted,
  onHoverTeam,
  viewMode = "predicted",
  showPredictions = true,
  compact = true,
}) {
  const isRealView = viewMode === "real";
  const homeWinner = node.has_winner && node.winner_id === node.home?.id;
  const awayWinner = node.has_winner && node.winner_id === node.away?.id;
  const homeLoser = node.has_winner && !homeWinner && !node.home?.is_placeholder;
  const awayLoser = node.has_winner && !awayWinner && !node.away?.is_placeholder;
  const predWinnerId = showPredictions ? node.predicted_winner_id : null;
  const needsPrediction = showPredictions && node.can_predict && !node.prediction;
  const finished = node.status === "FINISHED";

  const homeDisplayScore = finished
    ? node.home_score
    : (showPredictions && node.prediction ? node.prediction.home_goals : null);
  const awayDisplayScore = finished
    ? node.away_score
    : (showPredictions && node.prediction ? node.prediction.away_goals : null);
  const projectedScores = !finished && showPredictions && !!node.prediction;

  const classes = [
    "match-node",
    compact ? "match-node--compact" : "",
    node.status === "LIVE" ? "is-live" : "",
    finished ? "is-finished" : "",
    node.has_winner ? "has-winner" : "",
    node.phase_locked ? "is-phase-locked" : "",
    !node.match_id ? "is-placeholder" : "",
    highlighted ? "is-highlight" : "",
    needsPrediction ? "needs-prediction" : "",
    isRealView ? "match-node--view-real" : "match-node--view-predicted",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} onMouseLeave={() => onHoverTeam?.(null)}>
      <div className="match-node-header">
        <span className="match-node-slot-id">{node.bracket_slot}</span>
        <div className="match-node-header-badges">
          <span className={`match-node-view-badge ${isRealView ? "is-real" : "is-predicted"}`}>
            {isRealView ? "REAL" : "PRED"}
          </span>
          {node.phase_locked && <span className="match-node-locked-badge">Bloq.</span>}
          {node.status === "LIVE" && <span className="match-node-live">LIVE</span>}
        </div>
      </div>

      <TeamRow
        team={node.home}
        score={homeDisplayScore}
        isWinner={homeWinner}
        isLoser={homeLoser}
        isPredictedWinner={predWinnerId === node.home?.id}
        isProjectedScore={projectedScores}
        status={node.status}
        onMouseEnter={() => onHoverTeam?.(node.home?.id)}
      />
      <TeamRow
        team={node.away}
        score={awayDisplayScore}
        isWinner={awayWinner}
        isLoser={awayLoser}
        isPredictedWinner={predWinnerId === node.away?.id}
        isProjectedScore={projectedScores}
        status={node.status}
        onMouseEnter={() => onHoverTeam?.(node.away?.id)}
      />

      {needsPrediction && (
        <div className="match-node-hint">Predecida en Partidos</div>
      )}

      {node.prediction?.points_earned > 0 && (
        <div className="match-node-points">+{node.prediction.points_earned} pts</div>
      )}
    </div>
  );
}
