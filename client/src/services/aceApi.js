// ──────────────────────────────────────────────────────────────
// ACE API Service  — MongoDB Atlas Version
// Frontend service layer for communicating with the backend
// ──────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_ACE_API_URL || "http://localhost:5050";

// ── Auth Helper ─────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("edumentor_token");
}

function setToken(token) {
  localStorage.setItem("edumentor_token", token);
}

function removeToken() {
  localStorage.removeItem("edumentor_token");
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Request Helper ──────────────────────────────────────────

async function jsonRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg =
      typeof body === "object" ? body.error || JSON.stringify(body) : body;
    const err = new Error(msg || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return body;
}

// ── Auth endpoints ──────────────────────────────────────────

/**
 * Register a new user.
 * @param {{ name, email, password }} payload
 */
export async function registerUser(payload) {
  const data = await jsonRequest("/api/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data.token) setToken(data.token);
  return data;
}

/**
 * Login user.
 * @param {{ email, password }} payload
 */
export async function loginUser(payload) {
  const data = await jsonRequest("/api/users/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data.token) setToken(data.token);
  return data;
}

/**
 * Logout — clear token.
 */
export function logoutUser() {
  removeToken();
}

/**
 * Get current user's profile.
 */
export function getProfile() {
  return jsonRequest("/api/users/profile");
}

/**
 * Update user profile.
 * @param {{ name?, email? }} payload
 */
export function updateProfile(payload) {
  return jsonRequest("/api/users/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Check if user is authenticated (has token).
 */
export function isAuthenticated() {
  return !!getToken();
}

// ── Material endpoints ──────────────────────────────────────

/**
 * Upload files and extract text.
 * @param {FileList|File[]} files
 * @returns {Promise<{success, materialId, files, textLength, preview}>}
 */
export async function uploadMaterial(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(`${BASE}/api/materials/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
    // Note: do NOT set Content-Type — browser sets it with boundary
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}

/**
 * List all uploaded materials.
 */
export function getMaterials() {
  return jsonRequest("/api/materials");
}

/**
 * Get a single material by ID.
 */
export function getMaterialById(id) {
  return jsonRequest(`/api/materials/${id}`);
}

// Alias for backward compatibility
export const listMaterials = getMaterials;

// ── Quiz endpoints ──────────────────────────────────────────

/**
 * Generate a quiz from uploaded material.
 * @param {{materialId, questionType, difficulty, quantity}} payload
 * @returns {Promise<{success, quizId, questions, config}>}
 */
export function generateQuiz(payload) {
  return jsonRequest("/api/quiz/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Regenerate a quiz (new questions, same material).
 * @param {{materialId, questionType?, difficulty?, quantity?}} payload
 */
export function regenerateQuiz(payload) {
  return jsonRequest("/api/quiz/regenerate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get a single quiz by ID.
 */
export function getQuizById(quizId) {
  return jsonRequest(`/api/quiz/${quizId}`);
}

/**
 * List all quizzes.
 */
export function getQuizzes() {
  return jsonRequest("/api/quizzes");
}

/**
 * Get quizzes for a specific material.
 */
export function getQuizzesByMaterial(materialId) {
  return jsonRequest(`/api/quiz/material/${materialId}`);
}

// Alias for backward compatibility
export const getQuiz = getQuizById;

// ── Answer endpoints ────────────────────────────────────────

/**
 * Submit answers for scoring.
 * @param {{quizId, answers: Array<{questionId, userAnswer}>}} payload
 * @returns {Promise<{success, score, grade, results}>}
 */
export function submitAnswers(payload) {
  return jsonRequest("/api/answers/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get previous results for a quiz.
 */
export function getResults(quizId) {
  return jsonRequest(`/api/answers/results/${quizId}`);
}

/**
 * Get attempts for a specific quiz.
 */
export function getAttempts(quizId) {
  return jsonRequest(`/api/answers/attempts/${quizId}`);
}

/**
 * Get all attempts by a user.
 */
export function getUserAttempts(userId) {
  return jsonRequest(`/api/answers/user/${userId}`);
}

// ── Reinforcement (ACE) endpoints ───────────────────────────

/**
 * Get weak topics with progress for the logged-in user.
 */
export function getWeakTopics() {
  return jsonRequest("/api/reinforce/weak-topics");
}

/**
 * Generate a reinforcement quiz for a topic.
 * @param {{ topic: string }} payload
 */
export function generateReinforcementQuiz(payload) {
  return jsonRequest("/api/reinforce/generate-quiz", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Submit reinforcement answers and update mastery.
 * @param {{ topic: string, answers: Array<{questionId, userAnswer, correctAnswer}> }} payload
 */
export function submitReinforcementAnswers(payload) {
  return jsonRequest("/api/reinforce/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get reinforcement progress for all topics.
 */
export function getReinforcementProgress() {
  return jsonRequest("/api/reinforce/progress");
}

// ── Health ───────────────────────────────────────────────────

/**
 * Check backend + Ollama health.
 */
export function checkHealth() {
  return jsonRequest("/api/quiz/health");
}
