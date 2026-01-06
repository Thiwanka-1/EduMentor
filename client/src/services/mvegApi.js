// src/services/api.js
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

/* ----------------------------------
   LIST EXPLANATIONS
-----------------------------------*/
export async function listExplanations() {
  try {
    return await request("/api/explanations");
  } catch {
    // 🔁 fallback
    return MOCK_EXPLANATIONS.map((x) => ({
      _id: x._id,
      question: x.question,
      title: x.title,
      createdAt: x.createdAt,
    }));
  }
}

/* ----------------------------------
   GET SINGLE EXPLANATION
-----------------------------------*/
export async function getExplanation(id, mode = "simple") {
  try {
    return await request(`/api/explanations/${id}`);
  } catch {
    const mock = MOCK_EXPLANATIONS.find((x) => x._id === id);
    if (!mock) throw new Error("Not found");

    return {
      _id: mock._id,
      question: mock.question,
      title: mock.title,
      answer: mock.answers[mode] || mock.answers.simple,
      mode,
    };
  }
}

/* ----------------------------------
   GENERATE EXPLANATION
-----------------------------------*/
export async function generateExplanation({ message, mode, strict }) {
  try {
    return await request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, mode, strict }),
    });
  } catch {
    // // 🔁 mock generation
    // const mock =
    //   MOCK_EXPLANATIONS[Math.floor(Math.random() * MOCK_EXPLANATIONS.length)];
    // return {
    //   id: mock._id,
    //   content: mock.answers[mode] || mock.answers.simple,
    // };
  }
}

/* ----------------------------------
   DELETE (mock-safe)
-----------------------------------*/
export async function deleteExplanation(id) {
  try {
    return await request(`/api/explanations/${id}`, { method: "DELETE" });
  } catch {
    // silently succeed in prototype
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
