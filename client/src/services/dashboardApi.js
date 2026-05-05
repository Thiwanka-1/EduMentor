const API_BASE = "http://localhost:5000";

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

export async function getLessonSessions() {
  const res = await fetch(`${API_BASE}/api/lessons/sessions`, {
    method: "GET",
    credentials: "include",
  });

  return parseJsonResponse(res);
}

export async function getLessonSessionById(id) {
  const res = await fetch(`${API_BASE}/api/lessons/sessions/${id}`, {
    method: "GET",
    credentials: "include",
  });

  return parseJsonResponse(res);
}

export async function updateLessonNotes(id, notesText) {
  const res = await fetch(`${API_BASE}/api/lessons/sessions/${id}/notes`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ notesText }),
  });

  return parseJsonResponse(res);
}

export async function updateLessonMedia(id, payload) {
  const res = await fetch(`${API_BASE}/api/lessons/sessions/${id}/media`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
}

export async function deleteLessonSession(id) {
  const res = await fetch(`${API_BASE}/api/lessons/sessions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  return parseJsonResponse(res);
}