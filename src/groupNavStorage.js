export const openGroupKey = (userId) => `cromos_${userId}_open_group`;

const navKey = (userId, groupId, key) => `cromos_${userId}_${groupId}_${key}`;

export const readGroupNav = (userId, groupId, key, fallback) => {
  try {
    const value = sessionStorage.getItem(navKey(userId, groupId, key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const writeGroupNav = (userId, groupId, key, value) => {
  try {
    sessionStorage.setItem(navKey(userId, groupId, key), value);
  } catch {
    // sessionStorage no disponible
  }
};

export const clearOpenGroup = (userId) => {
  try {
    sessionStorage.removeItem(openGroupKey(userId));
  } catch {
    // noop
  }
};
