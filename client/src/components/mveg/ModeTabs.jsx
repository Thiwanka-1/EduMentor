import React from "react";

const MODES = [
  { key: "simple", label: "Simple" },
  { key: "analogy", label: "Analogy" },
  { key: "code", label: "Code" },
  { key: "summary", label: "Summary" },
];

export default function ModeTabs({ mode, setMode }) {
  return (
    <div className="inline-flex rounded-xl p-1 border border-slate-300 bg-white shadow-sm">
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={[
            "px-4 py-2 rounded-lg text-sm font-medium transition",
            mode === m.key
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100",
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
