import React, { useMemo, useState } from "react";
import { HelpCircle, Sparkles, Wand2 } from "lucide-react";
import { extractKeyTerms } from "../../utils/mvegText";

export default function StudyTools({ answerText, drawer = false }) {
  const [strict, setStrict] = useState(true);
  const [level, setLevel] = useState(55);

  const terms = useMemo(
    () => extractKeyTerms(answerText || "", 6),
    [answerText]
  );

  const related = [
    "UDP vs TCP",
    "OSI Model Layers",
    "Socket Programming",
    "Time Complexity",
    "Encapsulation vs Abstraction",
  ];

  return (
    <aside
      className={[
        "w-[340px] flex flex-col gap-4 px-4 py-4 border-l border-slate-200/70 bg-white/60 backdrop-blur",
        "dark:border-white/10 dark:bg-slate-950/40",
        drawer ? "w-full border-l-0" : "",
      ].join(" ")}
    >
      <h3 className="text-xs tracking-widest font-semibold text-slate-500 dark:text-slate-400">
        STUDY TOOLS
      </h3>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Strict Syllabus Only
          </p>
          <button
            onClick={() => setStrict(!strict)}
            className={[
              "w-12 h-6 rounded-full transition relative",
              strict
                ? "bg-slate-900 dark:bg-white"
                : "bg-slate-300 dark:bg-white/20",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition",
                strict ? "left-6" : "left-1",
              ].join(" ")}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          When on, the AI tries to prioritize your uploaded slides/books (RAG
          context).
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Complexity Level
          </p>
          <span
            className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200
                           dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
          >
            Undergraduate
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="w-full mt-3"
        />
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>Novice</span>
          <span>Expert</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Key Terms
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(terms.length ? terms : ["syllabus", "context", "concept"]).map(
            (t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200/70 bg-white/70 text-slate-700
                         dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200"
              >
                #{t}
              </span>
            )
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Sparkles size={16} />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Generate Quiz
          </p>
        </div>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          UI placeholder for now.
        </p>
        <button
          className="mt-3 w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition
                           dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 flex items-center justify-center gap-2"
        >
          <Wand2 size={16} /> Generate
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <HelpCircle size={16} />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Ask Follow-up
          </p>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 h-10 rounded-xl border border-slate-200/70 px-3 text-sm outline-none
                       dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
            placeholder="Type a question…"
          />
          <button className="h-10 px-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            →
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Related Concepts
        </p>
        <div className="mt-2 space-y-2">
          {related.map((r) => (
            <div
              key={r}
              className="text-sm text-slate-700 dark:text-slate-200 hover:underline cursor-pointer"
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
