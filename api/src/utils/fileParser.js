// File Parser Utility
// Extracts text from PDF, DOCX, and PNG (OCR) files
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from a single file based on its type.
 * @param {string} filePath – absolute path to the uploaded file
 * @returns {Promise<string>} extracted text
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return extractPDF(filePath);
    case ".docx":
      return extractDOCX(filePath);
    case ".png":
    case ".jpg":
    case ".jpeg":
      return extractImage(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Extract text from a PDF file.
 */
async function extractPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
}

/**
 * Extract text from a DOCX file using mammoth.
 */
async function extractDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
}

/**
 * Extract text from an image using Tesseract.js OCR.
 */
async function extractImage(filePath) {
  try {
    const Tesseract = require("tesseract.js");
    const { data } = await Tesseract.recognize(filePath, "eng", {
      logger: (info) => {
        if (info.status === "recognizing text") {
          process.stdout.write(
            `\r   OCR progress: ${Math.round(info.progress * 100)}%`,
            );
        }
      },
    });
    console.log(); // newline after progress
    return data.text || "";
  } catch (err) {
    console.warn("  OCR failed, returning empty text:", err.message);
    return "[Image text extraction failed – OCR unavailable]";
  }
}

/**
 * Extract text from multiple files and combine into a single context string.
 * @param {Array<{path: string, originalname: string}>} files
 * @returns {Promise<string>}
 */
async function extractFromMultipleFiles(files) {
  const results = [];

  for (const file of files) {
    const filePath = file.path || file;
    const name = file.originalname || path.basename(filePath);

    try {
      console.log(`   Extracting: ${name}`);
      const text = await extractText(filePath);
      results.push(`--- ${name} ---\n${text.trim()}`);
    } catch (err) {
      console.error(`   Error extracting ${name}: ${err.message}`);
      results.push(`--- ${name} ---\n[Extraction failed: ${err.message}]`);
    }
  }

  return results.join("\n\n");
}

module.exports = {
  extractText,
  extractFromMultipleFiles,
};
