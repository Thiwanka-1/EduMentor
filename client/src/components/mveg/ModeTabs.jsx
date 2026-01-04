import React from "react";

const MODES = [
  { key: "simple", label: "Simple" },
  { key: "analogy", label: "Analogy" },
  { key: "code", label: "Code" },
  { key: "summary", label: "Summary" },
];

export default function ModeTabs({ mode, setMode }) {
  return (
    <div
      className="inline-flex rounded-2xl p-1 border border-slate-200/70 bg-white/70
                    dark:border-white/10 dark:bg-slate-950/40"
    >
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={[
            "px-4 py-2 rounded-xl text-sm font-medium transition",
            mode === m.key
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-white/10",
          ].join(" ")}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export const instructionMap = {
  simple:
    "Explain very simply for a beginner. Use short sentences. Avoid jargon.",
  analogy:
    "Explain using real-world analogies and examples. Keep it intuitive.",
  code: "Explain with code examples. Add small snippets and explain them.",
  summary: "Give a concise bullet-point summary. Max 8 bullets.",
};
