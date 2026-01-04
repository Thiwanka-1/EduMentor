const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export function listExplanations() {
  return request("/api/explanations");
}

export function getExplanation(id) {
  return request(`/api/explanations/${id}`);
}

export async function generateExplanation(payload) {
  // ✅ try /generate first, fallback to /api/explanations
  try {
    return await request("/api/explanations/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    if (e.status === 404) {
      return request("/api/explanations", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    throw e;
  }
}

export function deleteExplanation(id) {
  return request(`/api/explanations/${id}`, { method: "DELETE" });
}
