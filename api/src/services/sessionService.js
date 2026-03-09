const sessions = {};

export function createSession(type) {
  const id = Math.random().toString(36).substring(2, 10);
  sessions[id] = { id, type, ws: null };
  return id;
}

export function getSession(id) {
  return sessions[id] || null;
}

export function removeSession(id) {
  delete sessions[id];
}
