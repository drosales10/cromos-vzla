import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function usePredictions(matchIds = []) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const idsKey = matchIds.join(",");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.getMyPredictions(
        matchIds.length ? { match_ids: matchIds.join(",") } : {},
      );
      setPredictions(rows || []);
    } catch (err) {
      setError(err?.message || "Error al cargar predicciones");
    } finally {
      setLoading(false);
    }
  }, [idsKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const savePrediction = async (matchId, homeGoals, awayGoals) => {
    const row = await api.savePrediction({
      match_id: matchId,
      home_goals: homeGoals,
      away_goals: awayGoals,
    });
    setPredictions((prev) => {
      const rest = prev.filter((p) => p.match_id !== matchId);
      return [row, ...rest];
    });
    return row;
  };

  return { predictions, loading, error, refresh, savePrediction };
}
