import React, { useMemo, useState } from "react";
import { HelpCircle, Sparkles, Wand2 } from "lucide-react";
import { extractKeyTerms } from "../../utils/mvegText";
import { useMveg } from "../../pages/mveg/mvegStore";

export default function StudyTools({ answerText, drawer = false }) {
  const { strict, setStrict } = useMveg();
  const [level, setLevel] = useState(55);

  const terms = useMemo(
    () => extractKeyTerms(answerText || "", 6),
    [answerText],
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
        "w-[340px] flex flex-col min-h-0",
        "border-l border-slate-200 bg-white px-5 py-5",
        drawer ? "w-full border-l-0" : "",
      ].join(" ")}
    >
      {/* Header */}
      <h3 className="text-xs tracking-widest font-semibold text-slate-500 mb-3">
        STUDY TOOLS
      </h3>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Strict Syllabus */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              Strict Syllabus Only
            </p>

            <button
              onClick={() => setStrict(!strict)}
              className={[
                "w-12 h-6 rounded-full transition relative",
                strict ? "bg-slate-900" : "bg-slate-300",
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

          <p className="mt-2 text-xs text-slate-600">
            When enabled, explanations prioritize uploaded slides and textbooks.
          </p>
        </Card>

        {/* Complexity */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              Complexity Level
            </p>
            <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Undergraduate
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full mt-3 accent-slate-900"
          />

          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Novice</span>
            <span>Expert</span>
          </div>
        </Card>

        {/* Key Terms */}
        <Card>
          <p className="text-sm font-semibold text-slate-800">Key Terms</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(terms.length ? terms : ["syllabus", "context", "concept"]).map(
              (t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-700"
                >
                  #{t}
                </span>
              ),
            )}
          </div>
        </Card>

        {/* Quiz */}
        <Card>
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <p className="text-sm font-semibold text-slate-800">
              Generate Quiz
            </p>
          </div>

          <p className="mt-2 text-xs text-slate-600">
            Automatically create mastery questions from this explanation.
          </p>

          <button className="mt-3 w-full h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center gap-2">
            <Wand2 size={16} /> Generate
          </button>
        </Card>

        {/* Ask Follow-up */}
        <Card>
          <div className="flex items-center gap-2">
            <HelpCircle size={16} />
            <p className="text-sm font-semibold text-slate-800">
              Ask Follow-up
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Type a question…"
            />
            <button className="h-10 px-3 rounded-lg bg-slate-900 text-white">
              →
            </button>
          </div>
        </Card>

        {/* Related */}
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            Related Concepts
          </p>

          <div className="mt-2 space-y-2">
            {related.map((r) => (
              <div
                key={r}
                className="text-sm text-slate-700 hover:underline cursor-pointer"
              >
                {r}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </aside>
  );
}

/* Reusable Card */
function Card({ children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}
