import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useStandings({ phase = "GROUP", group, mode = "real" } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.getStandings({
        phase,
        group,
        mode: mode === "predicted" ? "predicted" : undefined,
      });
      setData(rows);
    } catch (err) {
      setError(err?.message || "Error al cargar posiciones");
    } finally {
      setLoading(false);
    }
  }, [phase, group, mode]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}
