export function visemeFromText(text, durationMs) {
  const raw = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  const totalSec = Math.max(1.2, (durationMs || 1500) / 1000);

  if (!raw) {
    return [
      { t: 0, v: "SIL" },
      { t: Number(totalSec.toFixed(3)), v: "SIL" },
    ];
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

  function pickEnglish(ch) {
    if ("a".includes(ch)) return "AA";
    if ("e".includes(ch)) return "EE";
    if ("i".includes(ch)) return "EE";
    if ("o".includes(ch)) return "OH";
    if ("u".includes(ch)) return "OO";

    if ("bmp".includes(ch)) return "MBP";
    if ("fv".includes(ch)) return "FV";
    if ("szxctjkgdq".includes(ch)) return "SS";
    if ("w".includes(ch)) return "OO";
    if ("rlhyn".includes(ch)) return "AA";

    return "AA";
  }

  function pickSinhala(ch) {
    // Sinhala vowels and vowel signs
    if ("අආඇඈාැෑ".includes(ch)) return "AA";
    if ("ඉඊිීඑඒෙේෛ".includes(ch)) return "EE";
    if ("උඌුූ".includes(ch)) return "OO";
    if ("ඔඕොෝෞ".includes(ch)) return "OH";

    // Sinhala labial sounds
    if ("බභපඵමඹ".includes(ch)) return "MBP";

    // Sinhala f/v-like sounds
    if ("ෆව".includes(ch)) return "FV";

    // Sinhala s/sh/ch/j/k/t sounds
    if ("සශෂචඡජඣකඛගඝටඨඩඪතථදධ".includes(ch)) return "SS";

    // Nasals / liquids / others
    if ("නණංඞඬරලළයහ".includes(ch)) return "AA";

    return "AA";
  }

  function pickTamil(ch) {
    // Tamil vowels and vowel signs
    if ("அஆா".includes(ch)) return "AA";
    if ("இஈிீஎஏெேை".includes(ch)) return "EE";
    if ("உஊுூ".includes(ch)) return "OO";
    if ("ஒஓொோௌ".includes(ch)) return "OH";

    // Tamil labial sounds
    if ("பம".includes(ch)) return "MBP";

    // Tamil v/f-like sound
    if ("வ".includes(ch)) return "FV";

    // Tamil s/ch/j/t/k sounds
    if ("சஜஷஸஹகடதற".includes(ch)) return "SS";

    // Nasals / liquids / others
    if ("னநணஙஞரலளழய".includes(ch)) return "AA";

    return "AA";
  }

  function pickViseme(ch) {
    const lower = ch.toLowerCase();

    if (lower === " ") return "SIL";
    if (isPunctuation(lower)) return "SIL";

    if (isSinhala(lower)) return pickSinhala(lower);
    if (isTamil(lower)) return pickTamil(lower);

    return pickEnglish(lower);
  }

  function getWeight(ch) {
    if (ch === " ") return 0.35;
    if (isPunctuation(ch)) return 0.75;

    const lower = ch.toLowerCase();

    // Vowels usually stay open longer
    if ("aeiou".includes(lower)) return 1.15;

    // Sinhala/Tamil vowel signs also need more mouth movement time
    if ("අආඇඈාැෑඉඊිීඋඌුූඑඒෙේඔඕොෝෞ".includes(ch)) return 1.15;
    if ("அஆாஇஈிீஉஊுூஎஏெேஒஓொோௌ".includes(ch)) return 1.15;

    return 0.9;
  }

  const chars = [...raw];
  const totalWeight = chars.reduce((sum, ch) => sum + getWeight(ch), 0) || 1;

  const out = [];
  let currentTime = 0;
  let lastViseme = "SIL";
  let lastEventTime = -1;

  function pushEvent(t, v, force = false) {
    const fixedT = Number(Math.max(0, Math.min(t, totalSec)).toFixed(3));

    // Avoid too many events at the exact same time
    if (!force && fixedT - lastEventTime < 0.045 && v === lastViseme) {
      return;
    }

    // Allow repeated same-viseme events if enough time passed.
    // This helps prevent mouth motion from appearing stuck.
    if (!force && v === lastViseme && fixedT - lastEventTime < 0.16) {
      return;
    }

    out.push({ t: fixedT, v });
    lastViseme = v;
    lastEventTime = fixedT;
  }

  pushEvent(0, "SIL", true);

  for (const ch of chars) {
    const weight = getWeight(ch);
    const segmentDuration = (weight / totalWeight) * totalSec;
    const v = pickViseme(ch);

    const eventTime = currentTime + Math.min(0.035, segmentDuration * 0.25);

    if (v === "SIL") {
      pushEvent(currentTime, "SIL");
    } else {
      pushEvent(eventTime, v);
    }

    currentTime += segmentDuration;
  }

  // Add a few tiny refresh events if there are long gaps.
  // This makes the mouth keep updating during long generated audio.
  const refreshed = [];

  for (let i = 0; i < out.length; i++) {
    const current = out[i];
    const next = out[i + 1];

    refreshed.push(current);

    if (!next) continue;

    const gap = next.t - current.t;

    if (gap > 0.35 && current.v !== "SIL") {
      const count = Math.floor(gap / 0.28);

      for (let j = 1; j <= count; j++) {
        const t = current.t + j * 0.28;

        if (t < next.t - 0.08) {
          refreshed.push({
            t: Number(t.toFixed(3)),
            v: current.v,
          });
        }
      }
    }
  }

  refreshed.push({
    t: Number(totalSec.toFixed(3)),
    v: "SIL",
  });

  return refreshed
    .sort((a, b) => a.t - b.t)
    .filter((item, index, arr) => {
      if (index === 0) return true;

      const prev = arr[index - 1];

      return !(item.t === prev.t && item.v === prev.v);
    });
}