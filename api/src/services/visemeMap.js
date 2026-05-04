// ---------------------------------------------
// Piper phoneme → Viseme mapping
// ---------------------------------------------
// These viseme names match what frontend expects.
// You can adjust mapping anytime to improve lip-sync.
// ---------------------------------------------

export const visemeMap = {
  // ----- Vowels -----
  "a": "aa",
  "aʊ": "ow",
  "aɪ": "ay",
  "æ": "aa",
  "ɑ": "aa",
  "ɑr": "ar",
  "ɒ": "oh",
  "ɔ": "oh",
  "ɔɪ": "oy",
  "ə": "uh",
  "ɚ": "er",
  "ɛ": "eh",
  "eɪ": "ay",
  "ɜ": "er",
  "ɝ": "er",
  "i": "ee",
  "ɪ": "ih",
  "oʊ": "oh",
  "u": "oo",
  "ʊ": "uh",

  // ----- Nasals -----
  "m": "m",
  "n": "n",
  "ŋ": "ng",

  // ----- Plosives -----
  "p": "p",
  "b": "b",
  "t": "t",
  "d": "d",
  "k": "k",
  "g": "g",

  // ----- Fricatives -----
  "f": "f",
  "v": "v",
  "θ": "th",
  "ð": "th",
  "s": "s",
  "z": "z",
  "ʃ": "sh",
  "ʒ": "sh",
  "h": "h",

  // ----- Affricates -----
  "tʃ": "ch",
  "dʒ": "j",

  // ----- Liquids & semivowels -----
  "l": "l",
  "r": "r",
  "j": "y",
  "w": "w",

  // ----- Silence -----
  "sp": "rest",
  "sil": "rest",
  "": "rest",
};

// =====================================================
// ✅ ADDITIONS for LessonMode (DO NOT BREAK OLD PAGES)
// =====================================================

// Your frontend avatar expects these morph/viseme keys:
export const FRONTEND_VISEMES = {
  SIL: "SIL",
  AA: "AA",
  EE: "EE",
  OH: "OH",
  OO: "OO",
  FV: "FV",
  MBP: "MBP",
  SS: "SS",
};

// Map a normal letter to your frontend viseme keys.
// (This is for fallback when you DON’T have real phoneme timing.)
function charToFrontendViseme(ch) {
  if (!ch || /\s/.test(ch)) return FRONTEND_VISEMES.SIL;

  // Closed lips
  if (/[mbpMBP]/.test(ch)) return FRONTEND_VISEMES.MBP;

  // F/V
  if (/[fvFV]/.test(ch)) return FRONTEND_VISEMES.FV;

  // S/Z
  if (/[szSZ]/.test(ch)) return FRONTEND_VISEMES.SS;

  // Vowels
  if (/[aA]/.test(ch)) return FRONTEND_VISEMES.AA;
  if (/[eEiI]/.test(ch)) return FRONTEND_VISEMES.EE;
  if (/[oO]/.test(ch)) return FRONTEND_VISEMES.OH;
  if (/[uU]/.test(ch)) return FRONTEND_VISEMES.OO;

  return FRONTEND_VISEMES.SIL;
}

/**
 * ✅ buildVisemeTimeline(text, durationMs)
 *
 * Generates a simple viseme timeline compatible with your frontend playVisemes():
 * returns array of objects with { t, v } plus extra aliases { time, viseme }.
 *
 * Example output:
 * [{t:0, v:"AA"}, {t:80, v:"MBP"}, ...]
 */
export function buildVisemeTimeline(text, durationMs = 2000) {
  const s = String(text || "").trim();
  if (!s) {
    return [{ t: 0, v: FRONTEND_VISEMES.SIL, time: 0, viseme: FRONTEND_VISEMES.SIL }];
  }

  const clipped = s.slice(0, 300); // keep small
  const total = Math.max(800, Number(durationMs) || 2000);

  const step = Math.max(40, Math.floor(total / Math.max(12, clipped.length)));

  const out = [];
  let t = 0;

  for (let i = 0; i < clipped.length; i++) {
    const v = charToFrontendViseme(clipped[i]);
    out.push({ t, v, time: t, viseme: v });
    t += step;
  }

  out.push({
    t: Math.min(total, t),
    v: FRONTEND_VISEMES.SIL,
    time: Math.min(total, t),
    viseme: FRONTEND_VISEMES.SIL,
  });

  return out;
}
