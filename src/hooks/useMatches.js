import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useMatches({ phase, status, group, date } = {}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.listMatches({ phase, status, group, date, analytics: true });
      setMatches(rows || []);
    } catch (err) {
      setError(err?.message || "Error al cargar partidos");
    } finally {
      setLoading(false);
    }
  }, [phase, status, group, date]);

  useEffect(() => { refresh(); }, [refresh]);

  return { matches, loading, error, refresh };
}
