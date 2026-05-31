import React, { useEffect, useState } from "react";
import { api } from "../api";
import "./trade.css";

const URGENT_MS = 15 * 60 * 1000;

const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const statusClass = (status) => {
  if (status === "PENDING") return "trade-status-pending";
  if (status === "ACCEPTED") return "trade-status-accepted";
  return "trade-status-rejected";
};

export function TradeList({ currentUserId, filterUserIds, onAction }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const fetchTrades = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTrades();
      let rows = data || [];
      if (filterUserIds?.length) {
        const allowed = new Set(filterUserIds);
        rows = rows.filter((tr) => allowed.has(tr.from_user_id) && allowed.has(tr.to_user_id));
      }
      setTrades(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const refresh = setInterval(fetchTrades, 30000);
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, [filterUserIds?.join(",")]);

  const runAction = async (id, action) => {
    setBusyId(id);
    try {
      if (action === "accept") await api.acceptTrade(id);
      if (action === "reject") await api.rejectTrade(id);
      if (action === "cancel") await api.cancelTrade(id);
      await fetchTrades();
      if (onAction) onAction(action, id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading && trades.length === 0) return <div className="trade-panel">Cargando trueques...</div>;
  if (error && trades.length === 0) return <div className="trade-panel trade-error">{error}</div>;

  return (
    <div className="trade-panel">
      <h3>Mis trueques</h3>
      {error && <div className="trade-error" style={{ marginBottom: 10 }}>{error}</div>}

      {trades.length === 0 ? (
        <div style={{ color: "#8a9bb5", fontSize: 13 }}>No hay trueques todavía.</div>
      ) : (
        <div className="trade-table-wrap">
          <table className="trade-table">
            <thead>
              <tr>
                <th>De / Para</th>
                <th>Ofrece</th>
                <th>Pide</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const amReceiver = trade.to_user_id === currentUserId;
                const amSender = trade.from_user_id === currentUserId;
                const pending = trade.status === "PENDING";
                const expiresAt = trade.expires_at ? new Date(trade.expires_at) : null;
                const msLeft = expiresAt ? expiresAt.getTime() - nowTick : null;
                const isUrgent = pending && msLeft !== null && msLeft > 0 && msLeft <= URGENT_MS;

                return (
                  <tr key={trade.id}>
                    <td>
                      <div>{trade.from_user?.name || trade.from_user?.username || "—"}</div>
                      <div style={{ color: "#8a9bb5", fontSize: 11 }}>→ {trade.to_user?.name || trade.to_user?.username || "—"}</div>
                      {trade.note && <div className="trade-note">{trade.note}</div>}
                    </td>
                    <td>{(trade.give_ids || []).join(", ") || "—"}</td>
                    <td>{(trade.receive_ids || []).join(", ") || "—"}</td>
                    <td>
                      <span className={`trade-status ${statusClass(trade.status)}`}>{trade.status}</span>
                      {pending && expiresAt && (
                        <div className={`trade-countdown ${isUrgent ? "trade-countdown-urgent" : ""}`}>
                          {msLeft > 0 ? `Expira en ${formatCountdown(msLeft)}` : "Expirando..."}
                        </div>
                      )}
                    </td>
                    <td>
                      {pending && (
                        <div className="trade-actions">
                          {amReceiver && (
                            <>
                              <button className="trade-btn trade-btn-success" disabled={busyId === trade.id} onClick={() => runAction(trade.id, "accept")}>
                                Aceptar
                              </button>
                              <button className="trade-btn trade-btn-ghost" disabled={busyId === trade.id} onClick={() => runAction(trade.id, "reject")}>
                                Rechazar
                              </button>
                            </>
                          )}
                          {amSender && (
                            <button className="trade-btn trade-btn-danger" disabled={busyId === trade.id} onClick={() => runAction(trade.id, "cancel")}>
                              Cancelar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
