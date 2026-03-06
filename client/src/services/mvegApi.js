// src/services/mvegApi.js
import { MOCK_EXPLANATIONS } from "./mockMveg";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = new Error("API error");
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// helper: normalize item shape for old/new backend + mock
function normalizeExplanation(item) {
  if (!item) return item;

  const views = item.views || null;
  const mode = item.mode || "simple";

  return {
    ...item,
    mode,
    views,
    // keep backward compatibility
    answer: item.answer || (views ? views[mode] || views.simple || "" : ""),
  };
}

/* ----------------------------------
   LIST EXPLANATIONS
-----------------------------------*/
export async function listExplanations() {
  try {
    const data = await request("/api/explanations");
    return Array.isArray(data) ? data.map(normalizeExplanation) : [];
  } catch {
    // fallback mock
    return MOCK_EXPLANATIONS.map((x) => ({
      _id: x._id,
      question: x.question,
      title: x.title,
      mode: x.mode || "simple",
      createdAt: x.createdAt,
      views: {
        simple: x.answers?.simple || "",
        analogy: x.answers?.analogy || "",
        code: x.answers?.code || "",
        summary: x.answers?.summary || "",
      },
      answer: x.answers?.[x.mode || "simple"] || x.answers?.simple || "",
    }));
  }
}

/* ----------------------------------
   GET SINGLE EXPLANATION
-----------------------------------*/
export async function getExplanation(id, mode = "simple") {
  try {
    const item = await request(`/api/explanations/${id}`);
    return normalizeExplanation(item);
  } catch {
    const mock = MOCK_EXPLANATIONS.find((x) => x._id === id);
    if (!mock) throw new Error("Not found");

    const views = {
      simple: mock.answers?.simple || "",
      analogy: mock.answers?.analogy || "",
      code: mock.answers?.code || "",
      summary: mock.answers?.summary || "",
    };

    return {
      _id: mock._id,
      question: mock.question,
      title: mock.title,
      mode,
      views,
      answer: views[mode] || views.simple || "",
      createdAt: mock.createdAt,
    };
  }
}

/* ----------------------------------
   GENERATE EXPLANATION (single call -> all views)
-----------------------------------*/
export async function generateExplanation({ message, mode, strict }) {
  try {
    const res = await request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, mode, strict }),
    });

    // backend now returns { id, mode, content, views, ... }
    return {
      ...res,
      mode: res.mode || mode || "simple",
      views: res.views || null,
      content: res.content || res.answer || "",
      answer: res.answer || res.content || "",
    };
  } catch {
    // optional mock generation fallback
    const mock =
      MOCK_EXPLANATIONS[Math.floor(Math.random() * MOCK_EXPLANATIONS.length)];

    const views = {
      simple: mock?.answers?.simple || "",
      analogy: mock?.answers?.analogy || "",
      code: mock?.answers?.code || "",
      summary: mock?.answers?.summary || "",
    };

    return {
      id: mock?._id || crypto.randomUUID?.() || String(Date.now()),
      mode: mode || "simple",
      content: views[mode] || views.simple || "",
      answer: views[mode] || views.simple || "",
      views,
      question: message,
      title: message.split(" ").slice(0, 6).join(" "),
      createdAt: new Date().toISOString(),
    };
  }
}

/* ----------------------------------
   DELETE (mock-safe)
-----------------------------------*/
export async function deleteExplanation(id) {
  try {
    return await request(`/api/explanations/${id}`, { method: "DELETE" });
  } catch {
    return { ok: true };
  }
}

/* ----------------------------------
   RENAME EXPLANATION
-----------------------------------*/
export async function renameExplanation(id, title) {
  return request(`/api/explanations/${id}/title`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function getRelatedConcepts(explanationId) {
  return request(`/api/explanations/${explanationId}/related`);
}
