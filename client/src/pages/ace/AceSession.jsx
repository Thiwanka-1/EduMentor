import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Flag,
} from "lucide-react";

const QUESTIONS = [
  {
    id: 1,
    title: "ATP Synthase Role",
    question:
      "Explain the role of the ATP Synthase enzyme during the final stage of cellular respiration.",
    answer:
      "ATP synthase uses the proton gradient across the inner mitochondrial membrane to synthesize ATP from ADP and inorganic phosphate.",
  },
  {
    id: 2,
    title: "Electron Transport",
    question:
      "What is the role of the electron transport chain in cellular respiration?",
    answer:
      "It transfers electrons through membrane proteins to create a proton gradient used for ATP production.",
  },
  {
    id: 3,
    title: "Fermentation",
    question:
      "Why is fermentation important when oxygen is not available?",
    answer:
      "It regenerates NAD+ so glycolysis can continue producing ATP.",
  },
];

export default function AceSession() {
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState({}); // { id: true/false }

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const answered = Object.keys(results).length;
  const accuracy =
    answered === 0
      ? 0
      : Math.round(
          (Object.values(results).filter(Boolean).length /
            answered) *
            100
        );

  function checkAnswer() {
    const correct = userAnswer
      .toLowerCase()
      .includes("atp");
    setResults({ ...results, [q.id]: correct });
    setChecked(true);
  }

  function nextQuestion() {
    setChecked(false);
    setUserAnswer("");
    if (current < total - 1) {
      setCurrent(current + 1);
    }
  }

  return (
    <div className="flex gap-8">
      {/* ================= LEFT PANEL ================= */}
      <aside className="w-72 space-y-6">
        <div>
          <p className="text-xs text-slate-400">CURRENT MODULE</p>
          <h3 className="font-semibold mt-1">Advanced Biology</h3>
          <p className="text-sm text-slate-500">
            Chapter 4: Cellular Respiration
          </p>
        </div>

        {/* Progress */}
        <div>
          <p className="text-xs text-slate-400 mb-2">
            Progress {answered} / {total}
          </p>
          <div className="h-1.5 bg-white/10 rounded-full">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{
                width: `${(answered / total) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question list */}
        <div className="space-y-2">
          {QUESTIONS.map((item, i) => {
            const status = results[item.id];
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  ${
                    i === current
                      ? "bg-indigo-600/15 text-indigo-400"
                      : "bg-white/5"
                  }`}
              >
                {status === true && (
                  <CheckCircle
                    size={14}
                    className="text-emerald-400"
                  />
                )}
                {status === false && (
                  <XCircle
                    size={14}
                    className="text-red-400"
                  />
                )}
                {status === undefined && (
                  <span className="w-3" />
                )}
                {item.title}
              </div>
            );
          })}
        </div>

        {/* Accuracy */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-slate-400 mb-1">
            SESSION ACCURACY
          </p>
          <p className="text-lg font-semibold text-emerald-400">
            {accuracy}%
          </p>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 space-y-6">
        {/* Tag */}
        <div className="flex justify-between items-center">
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/15 text-indigo-400">
            CONCEPT APPLICATION
          </span>

          <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <Flag size={14} /> Flag for review
          </button>
        </div>

        {/* Question */}
        <div className="rounded-3xl border border-white/10 bg-[#070b18] p-8">
          <h1 className="text-2xl font-semibold leading-snug">
            {q.question}
          </h1>
          <p className="text-sm text-slate-400 mt-3">
            Consider the proton gradient and ion movement
            across the inner mitochondrial membrane.
          </p>
        </div>

        {/* Answer box */}
        <div className="rounded-3xl border border-white/10 bg-[#070b18] p-6">
          <textarea
            value={userAnswer}
            onChange={(e) =>
              setUserAnswer(e.target.value)
            }
            placeholder="Type your answer here..."
            className="w-full bg-transparent outline-none resize-none text-sm min-h-[120px]"
            disabled={checked}
          />

          <p className="text-xs text-slate-500 mt-2">
            Markdown supported
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button className="text-sm text-slate-400 hover:text-white">
              Hint (2 left)
            </button>
            <button className="text-sm text-slate-400 hover:text-white">
              Skip
            </button>
          </div>

          {!checked ? (
            <button
              onClick={checkAnswer}
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold"
            >
              Check Answer →
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
            >
              Next →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
