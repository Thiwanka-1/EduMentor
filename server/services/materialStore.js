// ──────────────────────────────────────────────────────────────
// Material Store  –  FILE-BACKED
// Persists extracted text to disk so data survives server restarts.
// Each material is saved as a separate JSON file under ./data/materials/
// ──────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATA_DIR = path.resolve(__dirname, "..", "data", "materials");

// Ensure directory exists on load
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Path helper
 */
function filePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

/**
 * Save extracted material to disk and return a materialId.
 */
function saveMaterial(files, extractedText) {
  const id = uuidv4();
  const entry = {
    id,
    files: files.map((f) => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    })),
    extractedText,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(filePath(id), JSON.stringify(entry), "utf-8");
  console.log(`  💾 Material saved to disk: ${id}`);
  return id;
}

/**
 * Retrieve material by ID from disk.
 */
function getMaterial(id) {
  const fp = filePath(id);
  if (!fs.existsSync(fp)) return null;

  try {
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`  ❌ Failed to read material ${id}:`, err.message);
    return null;
  }
}

/**
 * Delete material by ID.
 */
function deleteMaterial(id) {
  const fp = filePath(id);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    return true;
  }
  return false;
}

/**
 * List all stored materials (metadata only, no full text).
 */
function listMaterials() {
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const raw = fs.readFileSync(path.join(DATA_DIR, f), "utf-8");
      const { id, files: matFiles, createdAt } = JSON.parse(raw);
      return { id, files: matFiles, createdAt };
    });
  } catch {
    return [];
  }
}

module.exports = { saveMaterial, getMaterial, deleteMaterial, listMaterials };
