import { ALL_CROMOS } from "./albumData.js";

export const EMPTY_CROMOS = { quantities: {}, have: [], doubles: [] };

export const normalizeCromosPayload = (row) => {
  const quantities = { ...(row?.quantities || {}) };

  if (Object.keys(quantities).length === 0 && Array.isArray(row?.inventory)) {
    (row.inventory || []).forEach((item) => {
      const id = item?.sticker_id || item?.stickerId;
      const qty = Number(item?.quantity || 0);
      if (id && qty > 0) quantities[id] = qty;
    });
  }

  if (Object.keys(quantities).length === 0) {
    (row?.have || []).forEach((id) => { quantities[id] = Math.max(1, Number(quantities[id] || 0)); });
    (row?.doubles || row?.need || []).forEach((id) => { quantities[id] = Math.max(2, Number(quantities[id] || 0)); });
  }

  const have = Object.keys(quantities).filter((id) => Number(quantities[id] || 0) > 0);
  const doubles = Object.keys(quantities).filter((id) => Number(quantities[id] || 0) > 1);
  return { quantities, have, doubles };
};

export const getQtyMap = (cromoData) => cromoData?.quantities || {};

export const getOwnedIds = (cromoData) => Object.entries(getQtyMap(cromoData))
  .filter(([, qty]) => Number(qty || 0) > 0)
  .map(([id]) => id);

export const getDoubleIds = (cromoData) => Object.entries(getQtyMap(cromoData))
  .filter(([, qty]) => Number(qty || 0) > 1)
  .map(([id]) => id);

export const getOwnedCount = (cromoData) => getOwnedIds(cromoData).length;

export const getDoubleCount = (cromoData) => getDoubleIds(cromoData).length;

export const getMissingIds = (cromoData) => {
  const owned = new Set(getOwnedIds(cromoData));
  return ALL_CROMOS.filter((c) => !owned.has(c.id)).map((c) => c.id);
};

export const TRADE_MAX_STICKERS = 5;
