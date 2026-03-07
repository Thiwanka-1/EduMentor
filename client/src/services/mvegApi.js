import { api } from "./api"; // <-- Import your new centralized Axios instance
import { MOCK_EXPLANATIONS } from "./mockMveg";

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
    // Axios puts the response body inside the .data property
    const res = await api.get("/explanations");
    return Array.isArray(res.data) ? res.data.map(normalizeExplanation) : [];
  } catch (error) {
    console.warn("Failed to fetch explanations, falling back to mock data.", error.message);
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
    const res = await api.get(`/explanations/${id}`);
    return normalizeExplanation(res.data);
  } catch (error) {
    console.warn(`Failed to fetch explanation ${id}, falling back to mock data.`, error.message);
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
   GENERATE EXPLANATION
   ✅ now supports: strict + module + complexity
-----------------------------------*/
export async function generateExplanation({
  message,
  mode,
  strict,
  module = "ALL",
  complexity = 55,
}) {
  try {
    const res = await api.post("/chat", { message, mode, strict, module, complexity });
    const data = res.data;

    return {
      ...data,
      mode: data.mode || mode || "simple",
      views: data.views || null,
      content: data.content || data.answer || "",
      answer: data.answer || data.content || "",
    };
  } catch (error) {
    console.warn("Failed to generate explanation, falling back to mock data.", error.message);
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
      outOfScope: false,
    };
  }
}

/* ----------------------------------
   DELETE (mock-safe)
-----------------------------------*/
export async function deleteExplanation(id) {
  try {
    const res = await api.delete(`/explanations/${id}`);
    return res.data;
  } catch {
    return { ok: true };
  }
}

/* ----------------------------------
   RENAME EXPLANATION
-----------------------------------*/
export async function renameExplanation(id, title) {
  const res = await api.patch(`/explanations/${id}/title`, { title });
  return res.data;
}

/* ----------------------------------
   RELATED CONCEPTS
-----------------------------------*/
export async function getRelatedConcepts(explanationId) {
  const res = await api.get(`/explanations/${explanationId}/related`);
  return res.data;
}