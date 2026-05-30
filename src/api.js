const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader, ...(options.headers || {}) },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

const q = (params) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  const query = new URLSearchParams();
  entries.forEach(([k, v]) => query.set(k, String(v)));
  return `?${query.toString()}`;
};

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),

  getProfileById: (id) => request(`/profiles/${id}`),
  getProfileByUsername: (username) => request(`/profiles/by-username/${username}`),
  createProfile: (payload) => request("/profiles", { method: "POST", body: JSON.stringify(payload) }),
  updateProfile: (id, payload) => request(`/profiles/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteProfile: (id) => request(`/profiles/${id}`, { method: "DELETE" }),
  listProfiles: (params = {}) => request(`/profiles${q(params)}`),

  getUserCromos: (userId) => request(`/cromos/${userId}`),
  upsertUserCromos: (userId, payload) => request(`/cromos/${userId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteUserCromos: (userId) => request(`/cromos/${userId}`, { method: "DELETE" }),
  listUserCromos: (userIds = []) => request(`/cromos${q({ userIds: userIds.join(",") })}`),
  listAllCromos: () => request("/cromos"),
  listStickerCatalog: (params = {}) => request(`/stickers/catalog${q(params)}`),

  listGroupsByIds: (ids = []) => request(`/groups${q({ ids: ids.join(",") })}`),
  getGroupByCode: (code) => request(`/groups/by-code/${code}`),
  createGroup: (payload) => request("/groups", { method: "POST", body: JSON.stringify(payload) }),
  updateGroup: (id, payload) => request(`/groups/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  listConversationsByUser: (userId) => request(`/conversations${q({ userId })}`),
  getConversationBetween: (userA, userB) => request(`/conversations/between${q({ userA, userB })}`),
  createConversation: (payload) => request("/conversations", { method: "POST", body: JSON.stringify(payload) }),
  updateConversation: (id, payload) => request(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  listMessages: (conversationId) => request(`/messages${q({ conversationId })}`),
  createMessage: (payload) => request("/messages", { method: "POST", body: JSON.stringify(payload) }),

  saveAvatar: (id, avatarUrl) => request(`/profiles/${id}`, { method: "PATCH", body: JSON.stringify({ avatar_url: avatarUrl }) }),

  getEconomyMe: () => request("/economy/me"),
  claimDailyBonus: () => request("/economy/daily-claim", { method: "POST" }),
  buyPack: (packTypeId = "STD5", quantity = 1) => request("/economy/buy-pack", {
    method: "POST",
    body: JSON.stringify({ pack_type_id: packTypeId, quantity }),
  }),
  openPack: (packTypeId = "STD5", quantity = 1) => request("/economy/open-pack", {
    method: "POST",
    body: JSON.stringify({ pack_type_id: packTypeId, quantity }),
  }),
  redeemCoupon: (code) => request("/economy/coupon/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  }),
  listCouponRedemptions: (params = {}) => request(`/economy/coupon/redemptions${q(params)}`),
  listAdminCoupons: (params = {}) => request(`/admin/coupons${q(params)}`),
  createAdminCoupon: (payload) => request("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  updateAdminCoupon: (code, payload) => request(`/admin/coupons/${encodeURIComponent(code)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }),
  toggleAdminCoupon: (code, enabled) => request(`/admin/coupons/${encodeURIComponent(code)}/toggle`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  }),
  createAutoEventCoupon: (payload = {}) => request("/admin/coupons/auto-event", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  listAdminStickers: (params = {}) => request(`/admin/stickers${q(params)}`),
  upsertAdminSticker: (payload) => request("/admin/stickers", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  updateAdminSticker: (id, payload) => request(`/admin/stickers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }),
  setUserSuperuser: (id, enabled) => request(`/admin/users/${id}/superuser`, {
    method: "POST",
    body: JSON.stringify({ enabled }),
  }),
  listAuditLogs: (params = {}) => request(`/admin/audit-logs${q(params)}`),

  listTrades: (status) => request(`/trades${q({ status })}`),
  proposeTrade: (payload) => request("/trades/propose", {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  acceptTrade: (id) => request(`/trades/${id}/accept`, { method: "POST" }),
  rejectTrade: (id) => request(`/trades/${id}/reject`, { method: "POST" }),
  cancelTrade: (id) => request(`/trades/${id}/cancel`, { method: "POST" }),
};
