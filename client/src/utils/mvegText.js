export function truncate(s = "", n = 40) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

export function extractKeyTerms(text = "", limit = 6) {
  const cleaned = text
    .toLowerCase()
    .replace(/[`*_#>\[\]().,!?:;"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "as",
    "by",
    "it",
    "this",
    "that",
    "from",
    "at",
    "into",
    "can",
    "will",
    "may",
    "should",
    "also",
    "we",
    "you",
    "they",
    "their",
    "your",
  ]);

  const words = cleaned.split(" ").filter((w) => w.length >= 5 && !stop.has(w));
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}
