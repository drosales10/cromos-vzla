import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useLeaderboard(leagueId = null) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard(leagueId ? { league_id: leagueId } : {});
      setRows(data || []);
    } catch (err) {
      setError(err?.message || "Error al cargar clasificación");
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { rows, loading, error, refresh };
}
