// Quiz Store  –  FILE-BACKED
// Persists generated quizzes and results to disk so data
// survives server restarts (node --watch).
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const QUIZ_DIR = path.resolve(__dirname, "..", "data", "quizzes");
const RESULT_DIR = path.resolve(__dirname, "..", "data", "results");

// Ensure directories exist
[QUIZ_DIR, RESULT_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function qPath(id) {
  return path.join(QUIZ_DIR, `${id}.json`);
}
function rPath(id) {
  return path.join(RESULT_DIR, `${id}.json`);
}

/**
 * Save a generated quiz to disk.
 */
function saveQuiz(materialId, config, questions) {
  const id = uuidv4();
  const quiz = {
    id,
    materialId,
    config,
    questions,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(qPath(id), JSON.stringify(quiz), "utf-8");
  return quiz;
}

/**
 * Get quiz by ID.
 */
function getQuiz(id) {
  const fp = qPath(id);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Get the most recent quiz for a material.
 */
function getLatestQuizByMaterial(materialId) {
  try {
    const files = fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith(".json"));
    let latest = null;

    for (const f of files) {
      const quiz = JSON.parse(fs.readFileSync(path.join(QUIZ_DIR, f), "utf-8"));
      if (quiz.materialId !== materialId) continue;
      if (!latest || new Date(quiz.createdAt) > new Date(latest.createdAt)) {
        latest = quiz;
      }
    }
    return latest;
  } catch {
    return null;
  }
}

/**
 * Save quiz results (answers + scoring).
 */
function saveResult(quizId, result) {
  const id = uuidv4();
  const entry = { id, quizId, ...result, createdAt: new Date().toISOString() };
  fs.writeFileSync(rPath(id), JSON.stringify(entry), "utf-8");
  return entry;
}

/**
 * Get results for a specific quiz.
 */
function getResultsByQuiz(quizId) {
  try {
    const files = fs.readdirSync(RESULT_DIR).filter((f) => f.endsWith(".json"));
    return files
      .map((f) =>
        JSON.parse(fs.readFileSync(path.join(RESULT_DIR, f), "utf-8")),
        )
      .filter((r) => r.quizId === quizId);
  } catch {
    return [];
  }
}

module.exports = {
  saveQuiz,
  getQuiz,
  getLatestQuizByMaterial,
  saveResult,
  getResultsByQuiz,
};
