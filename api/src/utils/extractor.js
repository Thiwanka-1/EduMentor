import pdfParse from "pdf-parse";

export async function extractPDFText(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return "";
  }
}
