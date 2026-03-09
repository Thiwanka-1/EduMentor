// backend/services/slidesService.js
import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import mammoth from "mammoth";
import pdfParse from "pdf-parse-debugging-disabled"; // ✅ Using the safe package

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "output", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// docId -> { id, filename, filepath, mimetype, text, createdAt }
const docStore = new Map();

function extOf(name = "") {
  return path.extname(name).toLowerCase();
}

async function extractText({ filepath, mimetype, originalname }) {
  const ext = extOf(originalname);

  try {
    // txt / md
    if (mimetype?.startsWith("text/") || ext === ".txt" || ext === ".md") {
      return fs.readFileSync(filepath, "utf8");
    }

    // pdf
    if (mimetype === "application/pdf" || ext === ".pdf") {
      const buf = fs.readFileSync(filepath);
      const parsed = await pdfParse(buf);
      return parsed?.text || "";
    }

    // docx
    if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx"
    ) {
      const res = await mammoth.extractRawText({ path: filepath });
      return res?.value || "";
    }

    // pptx not implemented
    if (
      mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      ext === ".pptx"
    ) {
      return "";
    }

    return "";
  } catch (err) {
    console.error(`❌ Error extracting text from ${originalname}:`, err);
    throw new Error(`Could not read document text: ${err.message}`);
  }
}

// multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname || "");
    cb(null, `${id}${ext}`);
  },
});

const maxMb = Number(process.env.MAX_UPLOAD_MB || 25);

export const uploadSingle = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
}).single("file");

export async function handleUploadedFile(file) {
  if (!file) throw new Error("No file uploaded. Field name must be 'file'.");

  const docId = path.basename(file.filename, path.extname(file.filename));

  const text = await extractText({
    filepath: file.path,
    mimetype: file.mimetype,
    originalname: file.originalname,
  });

  const doc = {
    id: docId,
    filename: file.originalname,
    filepath: file.path,
    mimetype: file.mimetype,
    text: String(text || "").slice(0, 200_000),
    createdAt: new Date().toISOString(),
  };

  docStore.set(docId, doc);

  return {
    docId,
    filename: doc.filename,
    mimetype: doc.mimetype,
    chars: doc.text.length,
  };
}

export function getDoc(docId) {
  return docStore.get(docId) || null;
}