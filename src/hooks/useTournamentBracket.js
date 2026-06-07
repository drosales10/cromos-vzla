import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";

const LIVE_POLL_MS = 30000;

export function useTournamentBracket() {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getTournamentBracket();
      setBracket(data);
    } catch (err) {
      setError(err?.message || "Error al cargar el bracket");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    const nodes = bracket?.nodes_by_mode?.real || bracket?.nodes || [];
    const hasLive = nodes.some((n) => n.status === "LIVE");
    if (hasLive) pollRef.current = setInterval(refresh, LIVE_POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [bracket, refresh]);

  const savePrediction = async (matchId, homeGoals, awayGoals) => {
    await api.savePrediction({ match_id: matchId, home_goals: homeGoals, away_goals: awayGoals });
    await refresh();
  };

  return {
    bracket,
    loading,
    error,
    refresh,
    savePrediction,
  };
}
