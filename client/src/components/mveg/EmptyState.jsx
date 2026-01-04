import React from "react";
import { Sparkles } from "lucide-react";

export default function EmptyState({ onPick }) {
  const samples = [
    "Explain OOP concepts with examples",
    "What is polymorphism in Java?",
    "Explain TCP 3-way handshake",
    "Binary Search Tree vs AVL Tree",
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-900/10 dark:bg-white/10 grid place-items-center mb-4">
        <Sparkles className="text-slate-900 dark:text-white" />
      </div>

      <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
        Ready to learn? Let’s break down a complex topic.
      </h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl">
        Enter a concept to generate syllabus-aligned explanations. Switch views
        to learn the same idea from different angles.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="px-3 py-2 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white transition text-sm
                       dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/5 dark:text-slate-200"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
