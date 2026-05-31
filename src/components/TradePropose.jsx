import React, { useEffect, useState } from "react";
import { api } from "../api";
import { getDoubleIds, getMissingIds, normalizeCromosPayload, TRADE_MAX_STICKERS } from "../cromosUtils";
import "./trade.css";

export function TradePropose({ currentUserId, targetUserId, targetUserName, cromosMap = {}, onTradeCreated, onCancel }) {
  const [users, setUsers] = useState([]);
  const [toUserId, setToUserId] = useState(targetUserId || "");
  const [myDoubles, setMyDoubles] = useState([]);
  const [theirDoubles, setTheirDoubles] = useState([]);
  const [giveIds, setGiveIds] = useState([]);
  const [receiveIds, setReceiveIds] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (targetUserId) return;
    api.listProfiles({ excludeId: currentUserId, blocked: false }).then(setUsers).catch(() => {});
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    const loadMine = async () => {
      if (cromosMap[currentUserId]) {
        setMyDoubles(getDoubleIds(cromosMap[currentUserId]));
        return;
      }
      const data = await api.getUserCromos(currentUserId);
      setMyDoubles(getDoubleIds(normalizeCromosPayload(data)));
    };
    loadMine().catch(() => {});
  }, [currentUserId, cromosMap]);

  useEffect(() => {
    if (!toUserId) {
      setTheirDoubles([]);
      return;
    }
    const loadTheirs = async () => {
      if (cromosMap[toUserId]) {
        setTheirDoubles(getDoubleIds(cromosMap[toUserId]));
        return;
      }
      const data = await api.getUserCromos(toUserId);
      setTheirDoubles(getDoubleIds(normalizeCromosPayload(data)));
    };
    loadTheirs().catch(() => {});
  }, [toUserId, cromosMap]);

  const toggleId = (list, setList, id) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
      return;
    }
    if (list.length >= TRADE_MAX_STICKERS) return;
    setList([...list, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (giveIds.length === 0 && receiveIds.length === 0) {
      setError("Selecciona al menos una barajita");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.proposeTrade({
        to_user_id: toUserId,
        give_ids: giveIds,
        receive_ids: receiveIds,
        note: note.trim() || undefined,
      });
      setSuccess("Trueque propuesto correctamente");
      setGiveIds([]);
      setReceiveIds([]);
      setNote("");
      if (onTradeCreated) onTradeCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const myMissing = cromosMap[currentUserId]
    ? getMissingIds(cromosMap[currentUserId])
    : [];
  const suggestedReceive = theirDoubles.filter((id) => myMissing.includes(id));

  return (
    <form className="trade-panel" onSubmit={handleSubmit}>
      <h3>Proponer trueque{targetUserName ? ` con ${targetUserName}` : ""}</h3>

      {!targetUserId && (
        <div className="trade-field">
          <label>Usuario destino</label>
          <select value={toUserId} onChange={(e) => setToUserId(e.target.value)} required>
            <option value="">Selecciona usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name || u.username}</option>
            ))}
          </select>
        </div>
      )}

      <div className="trade-field">
        <label>Ofreces (repetidas) — {giveIds.length}/{TRADE_MAX_STICKERS}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {myDoubles.map((id) => (
            <button
              key={id}
              type="button"
              className={`trade-btn ${giveIds.includes(id) ? "trade-btn-success" : "trade-btn-ghost"}`}
              style={{ fontSize: 11, padding: "4px 8px" }}
              onClick={() => toggleId(giveIds, setGiveIds, id)}
            >
              {id}
            </button>
          ))}
          {myDoubles.length === 0 && <span style={{ color: "#8a9bb5", fontSize: 12 }}>No tienes repetidas</span>}
        </div>
      </div>

      <div className="trade-field">
        <label>Solicitas (sus repetidas) — {receiveIds.length}/{TRADE_MAX_STICKERS}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(suggestedReceive.length > 0 ? suggestedReceive : theirDoubles).map((id) => (
            <button
              key={id}
              type="button"
              className={`trade-btn ${receiveIds.includes(id) ? "trade-btn-success" : "trade-btn-ghost"}`}
              style={{ fontSize: 11, padding: "4px 8px" }}
              onClick={() => toggleId(receiveIds, setReceiveIds, id)}
            >
              {id}
            </button>
          ))}
          {theirDoubles.length === 0 && toUserId && (
            <span style={{ color: "#8a9bb5", fontSize: 12 }}>El usuario no tiene repetidas visibles</span>
          )}
        </div>
      </div>

      <div className="trade-field">
        <label>Nota (opcional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} placeholder="Mensaje para el destinatario..." />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="trade-btn" disabled={loading || !toUserId}>
          {loading ? "Enviando..." : "Proponer trueque"}
        </button>
        {onCancel && (
          <button type="button" className="trade-btn trade-btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>

      {error && <div className="trade-error">{error}</div>}
      {success && <div className="trade-success">{success}</div>}
    </form>
  );
}
