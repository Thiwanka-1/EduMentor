// src/utils/mvegPdf.js
import jsPDF from "jspdf";

function safeFileName(str = "mveg") {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

// Remove markdown symbols so PDF is clean
function stripMarkdown(md = "") {
  return String(md)
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, "")) // keep code text
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s*[-*+]\s+/gm, "• ") // bullets
    .replace(/^\s*\d+\.\s+/gm, "• ") // numbered list -> bullet
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1") // underline-like
    .trim();
}

export function exportMvegPdf({
  title = "MVEG Explanation",
  question = "",
  answer = "",
  meta = {},
}) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;

  let y = 56;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("EduMentor • MVEG", margin, y);

  // Divider
  y += 14;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);

  // Meta (Mode / Strict / Module / Complexity)
  y += 18;
  doc.setTextColor(30);
  doc.setFontSize(11);

  const metaLines = [];
  if (meta.mode) metaLines.push(`Mode: ${meta.mode}`);
  if (typeof meta.strict === "boolean")
    metaLines.push(`Strict Syllabus: ${meta.strict ? "ON" : "OFF"}`);
  if (meta.module) metaLines.push(`Module: ${meta.module}`);
  if (typeof meta.complexity !== "undefined")
    metaLines.push(`Complexity: ${meta.complexityLabel || meta.complexity}`);

  if (metaLines.length) {
    const metaText = metaLines.join("   •   ");
    const splitMeta = doc.splitTextToSize(metaText, maxWidth);
    doc.text(splitMeta, margin, y);
    y += splitMeta.length * 14 + 6;
  }

  // Question
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Question", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const qLines = doc.splitTextToSize(question || "—", maxWidth);
  doc.text(qLines, margin, y);
  y += qLines.length * 14 + 10;

  // Answer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Answer", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const cleanAnswer = stripMarkdown(answer || "");
  const aLines = doc.splitTextToSize(cleanAnswer || "—", maxWidth);

  // Handle multi-page
  const lineHeight = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  for (const line of aLines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  // Footer (page number)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  // Download
  const file = `${safeFileName(title)}.pdf`;
  doc.save(file);
}
