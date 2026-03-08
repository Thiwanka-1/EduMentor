// backend/utils/chunkText.js
export function chunkText(text, maxLen = 140) {
  if (!text) return [];
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/); // split by sentence end

  const chunks = [];
  let cur = "";

  for (const p of parts) {
    const next = (cur ? cur + " " : "") + p;
    if (next.length > maxLen) {
      if (cur) chunks.push(cur.trim());
      // if a single sentence is huge, hard-cut it
      if (p.length > maxLen) {
        for (let i = 0; i < p.length; i += maxLen) {
          chunks.push(p.slice(i, i + maxLen));
        }
        cur = "";
      } else {
        cur = p;
      }
    } else {
      cur = next;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}
