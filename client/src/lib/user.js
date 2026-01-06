// client/src/lib/user.js
export function getUserId() {
  let id = localStorage.getItem("sb_userId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sb_userId", id);
  }
  return id;
}

export function setUserId(newId) {
  const id = (newId || "").trim();
  if (!id) return;
  localStorage.setItem("sb_userId", id);
}

export function resetUserId() {
  const id = crypto.randomUUID();
  localStorage.setItem("sb_userId", id);
  return id;
}
