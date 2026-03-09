// ACE API Service  — MongoDB Atlas Version (Cookie Auth Enabled)
// Frontend service layer for communicating with the backend

const BASE = import.meta.env.VITE_ACE_API_URL || "http://localhost:5000";

// ==========================================
// AUTH STATE MANAGEMENT
// We no longer store tokens! We just store a safe boolean flag 
// so the frontend knows if the user is logged in.
// ==========================================
function setLoginFlag() {
  localStorage.setItem("edumentor_is_logged_in", "true");
}

function removeLoginFlag() {
  localStorage.removeItem("edumentor_is_logged_in");
}

/**
 * Check if user is authenticated.
 * (Relies on the safe flag since JS cannot read HTTP-only cookies).
 */
export function isAuthenticated() {
  return localStorage.getItem("edumentor_is_logged_in") === "true";
}

// ==========================================
// BASE FETCH WRAPPER
// ==========================================
async function jsonRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // <-- MAGIC HAPPENS HERE: Tells browser to send cookies!
    ...options,
  });

  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg = typeof body === "object" ? body.error || JSON.stringify(body) : body;
    const err = new Error(msg || `Request failed: ${res.status}`);
    err.status = res.status;
    // If we get a 401 Unauthorized, automatically clear the login flag
    if (res.status === 401) removeLoginFlag();
    throw err;
  }

  return body;
}

// ==========================================
// USER & AUTH ROUTES
// ==========================================

/**
 * Register a new user.
 * @param {{ name, email, password }} payload
 */
export async function registerUser(payload) {
  // ✅ FIX 1: Changed from /api/users/register to /api/auth/signup
  const data = await jsonRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // ✅ FIX 2: Your new backend returns _id directly, not success: true
  if (data._id || data.name) setLoginFlag();
  return data;
}

/**
 * Login user.
 * @param {{ email, password }} payload
 */
export async function loginUser(payload) {
  // ✅ FIX 3: Changed from /api/users/login to /api/auth/login
  const data = await jsonRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // ✅ FIX 4: Check for _id instead of success
  if (data._id || data.name) setLoginFlag();
  return data;
}

/**
 * Logout — clear cookie & flag.
 */
export async function logoutUser() {
  try {
    // ✅ FIX 5: Changed from /api/users/logout to /api/auth/logout
    await jsonRequest("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Logout error", err);
  } finally {
    removeLoginFlag();
  }
}

/**
 * Get current user's profile.
 */
export function getProfile() {
  return jsonRequest("/api/auth/profile"); 
}

/**
 * Update user profile.
 * @param {{ name?, email? }} payload
 */
export function updateProfile(payload) {
  // ✅ FIX 6: Changed from /api/users/profile to /api/auth/profile
  return jsonRequest("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ==========================================
// MATERIALS API
// ==========================================

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
    credentials: "include", // <-- REQUIRED FOR COOKIES
    body: formData,
    // Note: do NOT set Content-Type — browser sets it with boundary
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) removeLoginFlag();
    throw new Error(data.error || "Upload failed");
  }
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

// ==========================================
// QUIZ API
// ==========================================

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

// ==========================================
// ANSWERS & ATTEMPTS API
// ==========================================

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

// ==========================================
// REINFORCEMENT API
// ==========================================

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

// ==========================================
// FLASHCARDS API
// ==========================================

/**
 * Generate flashcards from a PDF file or pasted text.
 * @param {{ file?: File, text?: string, deckName?: string, description?: string, tags?: string[] }} options
 */
export async function generateFlashcards({
  file,
  text,
  deckName,
  description,
  tags,
}) {
  const formData = new FormData();

  if (file) formData.append("file", file);
  if (text) formData.append("text", text);
  if (deckName) formData.append("deckName", deckName);
  if (description) formData.append("description", description);
  if (tags && tags.length > 0) {
    tags.forEach((t) => formData.append("tags", t));
  }

  const res = await fetch(`${BASE}/api/flashcards/generate`, {
    method: "POST",
    credentials: "include", // <-- REQUIRED FOR COOKIES
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) removeLoginFlag();
    throw new Error(data.error || "Flashcard generation failed");
  }
  return data;
}

/**
 * List all flashcard decks for the logged-in user.
 */
export function listFlashcardDecks() {
  return jsonRequest("/api/flashcards");
}

/**
 * Get a single flashcard deck by ID (with full cards for study mode).
 */
export function getFlashcardDeck(deckId) {
  return jsonRequest(`/api/flashcards/${deckId}`);
}

/**
 * Update a flashcard deck.
 * @param {string} deckId
 * @param {{ deckName?, description?, tags?, cards? }} payload
 */
export function updateFlashcardDeck(deckId, payload) {
  return jsonRequest(`/api/flashcards/${deckId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a flashcard deck.
 */
export function deleteFlashcardDeck(deckId) {
  return jsonRequest(`/api/flashcards/${deckId}`, {
    method: "DELETE",
  });
}

// ==========================================
// DASHBOARD & ANALYSIS API
// ==========================================

/**
 * Get aggregated dashboard summary (mastery, questions today, files, etc).
 */
export function getDashboardSummary() {
  return jsonRequest("/api/dashboard/summary");
}

/**
 * Get full progress analysis (mastery, streak, trends, weak points, etc).
 */
export function getProgressAnalysis() {
  return jsonRequest("/api/analysis/progress");
}

// ==========================================
// HEALTH API
// ==========================================

/**
 * Check backend + Ollama health.
 */
export function checkHealth() {
  return jsonRequest("/api/quiz/health");
}