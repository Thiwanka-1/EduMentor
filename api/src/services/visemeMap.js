// ---------------------------------------------
// Piper phoneme → Viseme mapping
// ---------------------------------------------
// Keep this old map for old pages / Piper support.
// LessonMode should use FRONTEND_VISEMES: SIL, AA, EE, OH, OO, FV, MBP, SS
// ---------------------------------------------

export const visemeMap = {
  // ----- Vowels -----
  a: "aa",
  "aʊ": "ow",
  "aɪ": "ay",
  æ: "aa",
  ɑ: "aa",
  "ɑr": "ar",
  ɒ: "oh",
  ɔ: "oh",
  "ɔɪ": "oy",
  ə: "uh",
  ɚ: "er",
  ɛ: "eh",
  "eɪ": "ay",
  ɜ: "er",
  ɝ: "er",
  i: "ee",
  ɪ: "ih",
  "oʊ": "oh",
  u: "oo",
  ʊ: "uh",

  // ----- Nasals -----
  m: "m",
  n: "n",
  ŋ: "ng",

  // ----- Plosives -----
  p: "p",
  b: "b",
  t: "t",
  d: "d",
  k: "k",
  g: "g",

  // ----- Fricatives -----
  f: "f",
  v: "v",
  θ: "th",
  ð: "th",
  s: "s",
  z: "z",
  ʃ: "sh",
  ʒ: "sh",
  h: "h",

  // ----- Affricates -----
  "tʃ": "ch",
  "dʒ": "j",

  // ----- Liquids & semivowels -----
  l: "l",
  r: "r",
  j: "y",
  w: "w",

  // ----- Silence -----
  sp: "rest",
  sil: "rest",
  "": "rest",
};

// =====================================================
// LessonMode frontend visemes
// =====================================================

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

// Converts old Piper-style viseme names to your frontend keys.
const OLD_TO_FRONTEND = {
  rest: FRONTEND_VISEMES.SIL,

  aa: FRONTEND_VISEMES.AA,
  ar: FRONTEND_VISEMES.AA,
  uh: FRONTEND_VISEMES.AA,
  er: FRONTEND_VISEMES.AA,

  eh: FRONTEND_VISEMES.EE,
  ee: FRONTEND_VISEMES.EE,
  ih: FRONTEND_VISEMES.EE,
  ay: FRONTEND_VISEMES.EE,

  oh: FRONTEND_VISEMES.OH,
  ow: FRONTEND_VISEMES.OH,
  oy: FRONTEND_VISEMES.OH,

  oo: FRONTEND_VISEMES.OO,
  w: FRONTEND_VISEMES.OO,

  f: FRONTEND_VISEMES.FV,
  v: FRONTEND_VISEMES.FV,

  m: FRONTEND_VISEMES.MBP,
  p: FRONTEND_VISEMES.MBP,
  b: FRONTEND_VISEMES.MBP,

  s: FRONTEND_VISEMES.SS,
  z: FRONTEND_VISEMES.SS,
  sh: FRONTEND_VISEMES.SS,
  ch: FRONTEND_VISEMES.SS,
  j: FRONTEND_VISEMES.SS,
  th: FRONTEND_VISEMES.SS,
  t: FRONTEND_VISEMES.SS,
  d: FRONTEND_VISEMES.SS,
  k: FRONTEND_VISEMES.SS,
  g: FRONTEND_VISEMES.SS,

  n: FRONTEND_VISEMES.AA,
  ng: FRONTEND_VISEMES.AA,
  l: FRONTEND_VISEMES.AA,
  r: FRONTEND_VISEMES.AA,
  y: FRONTEND_VISEMES.EE,
  h: FRONTEND_VISEMES.AA,
};

function isFrontendViseme(value = "") {
  return Object.values(FRONTEND_VISEMES).includes(value);
}

export function phonemeToFrontendViseme(phoneme = "") {
  const raw = String(phoneme || "").trim();

  if (!raw) return FRONTEND_VISEMES.SIL;

  if (isFrontendViseme(raw)) {
    return raw;
  }

  const oldViseme = visemeMap[raw] || raw;
  return OLD_TO_FRONTEND[oldViseme] || FRONTEND_VISEMES.AA;
}

function isSinhala(ch) {
  return /[\u0D80-\u0DFF]/.test(ch);
}

function isTamil(ch) {
  return /[\u0B80-\u0BFF]/.test(ch);
}

function isPunctuation(ch) {
  return /[.,!?;:()[\]{}'"“”‘’\-–—।॥]/.test(ch);
}

function isVowelLike(ch) {
  const lower = String(ch || "").toLowerCase();

  if ("aeiou".includes(lower)) return true;

  // Sinhala vowels / vowel signs
  if ("අආඇඈාැෑඉඊිීඋඌුූඑඒෙේෛඔඕොෝෞ".includes(ch)) {
    return true;
  }

  // Tamil vowels / vowel signs
  if ("அஆாஇஈிீஉஊுூஎஏெேைஒஓொோௌ".includes(ch)) {
    return true;
  }

  return false;
}

function charToFrontendViseme(ch) {
  if (!ch || /\s/.test(ch)) return FRONTEND_VISEMES.SIL;
  if (isPunctuation(ch)) return FRONTEND_VISEMES.SIL;

  const lower = ch.toLowerCase();

  // English
  if (/[mbp]/i.test(ch)) return FRONTEND_VISEMES.MBP;
  if (/[fv]/i.test(ch)) return FRONTEND_VISEMES.FV;
  if (/[szxctjkgdq]/i.test(ch)) return FRONTEND_VISEMES.SS;

  if (lower === "a") return FRONTEND_VISEMES.AA;
  if (lower === "e" || lower === "i") return FRONTEND_VISEMES.EE;
  if (lower === "o") return FRONTEND_VISEMES.OH;
  if (lower === "u") return FRONTEND_VISEMES.OO;
  if (lower === "w") return FRONTEND_VISEMES.OO;

  // Sinhala
  if (isSinhala(ch)) {
    if ("අආඇඈාැෑ".includes(ch)) return FRONTEND_VISEMES.AA;
    if ("ඉඊිීඑඒෙේෛ".includes(ch)) return FRONTEND_VISEMES.EE;
    if ("උඌුූ".includes(ch)) return FRONTEND_VISEMES.OO;
    if ("ඔඕොෝෞ".includes(ch)) return FRONTEND_VISEMES.OH;

    if ("බභපඵමඹ".includes(ch)) return FRONTEND_VISEMES.MBP;
    if ("ෆව".includes(ch)) return FRONTEND_VISEMES.FV;
    if ("සශෂචඡජඣකඛගඝටඨඩඪතථදධ".includes(ch)) {
      return FRONTEND_VISEMES.SS;
    }

    return FRONTEND_VISEMES.AA;
  }

  // Tamil
  if (isTamil(ch)) {
    if ("அஆா".includes(ch)) return FRONTEND_VISEMES.AA;
    if ("இஈிீஎஏெேை".includes(ch)) return FRONTEND_VISEMES.EE;
    if ("உஊுூ".includes(ch)) return FRONTEND_VISEMES.OO;
    if ("ஒஓொோௌ".includes(ch)) return FRONTEND_VISEMES.OH;

    if ("பம".includes(ch)) return FRONTEND_VISEMES.MBP;
    if ("வ".includes(ch)) return FRONTEND_VISEMES.FV;
    if ("சஜஷஸஹகடதற".includes(ch)) return FRONTEND_VISEMES.SS;

    return FRONTEND_VISEMES.AA;
  }

  // Default mouth-open shape instead of silence.
  // This prevents the lips from stopping too often.
  return FRONTEND_VISEMES.AA;
}

function getCharWeight(ch) {
  if (!ch || /\s/.test(ch)) return 0.45;
  if (isPunctuation(ch)) return 0.75;
  if (isVowelLike(ch)) return 1.25;

  const v = charToFrontendViseme(ch);

  if (v === FRONTEND_VISEMES.MBP) return 0.7;
  if (v === FRONTEND_VISEMES.FV) return 0.8;
  if (v === FRONTEND_VISEMES.SS) return 0.85;

  return 0.95;
}

function estimateDurationSec(text = "") {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  // Around 140 words per minute.
  return Math.max(0.8, (words / 140) * 60);
}

function normalizeDurationToSeconds(durationMsOrSec, text = "") {
  const value = Number(durationMsOrSec);

  if (!value || Number.isNaN(value) || value <= 0) {
    return estimateDurationSec(text);
  }

  // If large, treat as milliseconds.
  // If small, treat as seconds.
  return value > 50 ? value / 1000 : value;
}

function makeEvent(tSec, viseme) {
  const t = Number(Math.max(0, tSec).toFixed(3));
  const time = Math.round(t * 1000);

  return {
    t,
    v: viseme,
    time,
    viseme,
  };
}

function pushEvent(out, tSec, viseme, force = false) {
  const last = out[out.length - 1];

  if (!force && last) {
    const sameViseme = last.v === viseme;
    const tooClose = Math.abs(tSec - last.t) < 0.07;

    if (sameViseme && tooClose) {
      return;
    }
  }

  out.push(makeEvent(tSec, viseme));
}

/**
 * buildVisemeTimeline(text, durationMs)
 *
 * Better fallback lip-sync for LessonMode.
 *
 * Important:
 * - `t` is in seconds for frontend playVisemes().
 * - `time` is in milliseconds for old code compatibility.
 * - `v` and `viseme` both use frontend viseme keys.
 */
export function buildVisemeTimeline(text, durationMs = 2000) {
  const raw = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  const totalSec = Math.max(0.8, normalizeDurationToSeconds(durationMs, raw));

  if (!raw) {
    return [
      makeEvent(0, FRONTEND_VISEMES.SIL),
      makeEvent(totalSec, FRONTEND_VISEMES.SIL),
    ];
  }

  const clipped = [...raw].slice(0, 700);
  const totalWeight =
    clipped.reduce((sum, ch) => sum + getCharWeight(ch), 0) || 1;

  const out = [];
  let currentTime = 0;

  pushEvent(out, 0, FRONTEND_VISEMES.SIL, true);

  for (const ch of clipped) {
    const weight = getCharWeight(ch);
    const segmentDuration = (weight / totalWeight) * totalSec;
    const viseme = charToFrontendViseme(ch);

    const eventTime =
      viseme === FRONTEND_VISEMES.SIL
        ? currentTime
        : currentTime + Math.min(0.035, segmentDuration * 0.25);

    pushEvent(out, eventTime, viseme);

    currentTime += segmentDuration;
  }

  const improved = [];

  for (let i = 0; i < out.length; i += 1) {
    const current = out[i];
    const next = out[i + 1];

    improved.push(current);

    if (!next) continue;

    const gap = next.t - current.t;

    // Prevent the mouth from freezing during long syllables.
    if (
      gap > 0.36 &&
      current.v !== FRONTEND_VISEMES.SIL &&
      next.v !== FRONTEND_VISEMES.SIL
    ) {
      const midViseme =
        current.v === FRONTEND_VISEMES.AA
          ? FRONTEND_VISEMES.EE
          : FRONTEND_VISEMES.AA;

      improved.push(makeEvent(current.t + gap * 0.5, midViseme));
    }

    // Add natural short silence on longer punctuation/space gaps.
    if (
      gap > 0.42 &&
      (current.v === FRONTEND_VISEMES.SIL || next.v === FRONTEND_VISEMES.SIL)
    ) {
      improved.push(makeEvent(current.t + Math.min(0.18, gap * 0.45), FRONTEND_VISEMES.SIL));
    }
  }

  const last = improved[improved.length - 1];

  if (!last || last.v !== FRONTEND_VISEMES.SIL || last.t < totalSec - 0.05) {
    improved.push(makeEvent(totalSec, FRONTEND_VISEMES.SIL));
  }

  return improved
    .map((item) => ({
      ...item,
      t: Number(Math.min(item.t, totalSec).toFixed(3)),
      time: Math.round(Math.min(item.t, totalSec) * 1000),
    }))
    .sort((a, b) => a.t - b.t)
    .filter((item, index, arr) => {
      if (index === 0) return true;

      const prev = arr[index - 1];

      return !(item.t === prev.t && item.v === prev.v);
    });
}

/**
 * Optional helper for real Piper phoneme lists.
 * Use this only if your Piper service gives phoneme timing.
 */
export function buildVisemeTimelineFromPhonemes(phonemes = [], durationMs = 2000) {
  if (!Array.isArray(phonemes) || phonemes.length === 0) {
    return buildVisemeTimeline("", durationMs);
  }

  const totalSec = Math.max(0.8, normalizeDurationToSeconds(durationMs, ""));

  const out = [makeEvent(0, FRONTEND_VISEMES.SIL)];

  phonemes.forEach((item, index) => {
    const phoneme =
      typeof item === "string"
        ? item
        : item.phoneme || item.phone || item.value || "";

    const rawTime =
      typeof item === "object"
        ? item.t ?? item.time ?? item.start ?? item.startTime
        : null;

    let t;

    if (rawTime === null || rawTime === undefined || Number.isNaN(Number(rawTime))) {
      t = (index / Math.max(1, phonemes.length)) * totalSec;
    } else {
      const numericTime = Number(rawTime);
      t = numericTime > 50 ? numericTime / 1000 : numericTime;
    }

    const viseme = phonemeToFrontendViseme(phoneme);
    pushEvent(out, Math.min(t, totalSec), viseme);
  });

  pushEvent(out, totalSec, FRONTEND_VISEMES.SIL, true);

  return out
    .sort((a, b) => a.t - b.t)
    .filter((item, index, arr) => {
      if (index === 0) return true;

      const prev = arr[index - 1];

      return !(item.t === prev.t && item.v === prev.v);
    });
}