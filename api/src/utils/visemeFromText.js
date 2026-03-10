export function visemeFromText(text, durationMs) {
  const s = (text || "").toLowerCase().replace(/\s+/g, " ").trim();
  const totalSec = Math.max(1.2, (durationMs || 1500) / 1000);
  const n = Math.max(1, s.length);

  const pick = (ch) => {
    if ("ae".includes(ch)) return "AA";
    if (ch === "i") return "EE";
    if (ch === "o") return "OH";
    if (ch === "u") return "OO";
    if ("fvw".includes(ch)) return "FV";
    if ("bmp".includes(ch)) return "MBP";
    if ("szxctk".includes(ch)) return "SS";
    if (ch === " ") return "SIL";
    return "AA";
  };

  const out = [];
  let last = "SIL";

  for (let i = 0; i < n; i++) {
    const v = pick(s[i]);
    const t = (i / n) * totalSec;
    if (v !== last) {
      out.push({ t: Number(t.toFixed(3)), v });
      last = v;
    }
  }

  out.push({ t: Number(totalSec.toFixed(3)), v: "SIL" });
  return out;
}
