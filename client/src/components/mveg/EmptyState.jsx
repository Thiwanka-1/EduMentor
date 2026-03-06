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
    <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-slate-50">
      {/* Icon */}
      <div className="w-14 h-14 rounded-xl bg-slate-100 grid place-items-center mb-5">
        <Sparkles className="text-slate-700" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-semibold text-slate-900">
        Ready to learn? Let’s break down a complex topic.
      </h2>

      {/* Description */}
      <p className="mt-3 text-slate-600 max-w-xl leading-relaxed">
        Enter a concept to generate syllabus-aligned explanations. Switch views
        to explore the same idea from multiple perspectives.
      </p>

      {/* Sample Buttons */}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {samples.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition text-sm text-slate-700 shadow-sm"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
