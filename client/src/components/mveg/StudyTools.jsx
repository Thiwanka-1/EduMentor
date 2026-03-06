import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { useMveg } from "../../pages/mveg/mvegStore";
import { getRelatedConcepts } from "../../services/mvegApi";

const MODULES = ["ALL", "AI", "ML", "DBMS", "OOP", "DSA", "SE", "NET", "OS"];

function complexityLabel(level = 55) {
  if (level <= 30) return "Novice";
  if (level <= 70) return "Undergraduate";
  return "Advanced";
}

export default function StudyTools({ answerText, drawer = false }) {
  const {
    strict,
    setStrict,
    active,
    setInput,

    // ✅ new global controls
    module,
    setModule,
    complexity,
    setComplexity,
  } = useMveg();

  const [related, setRelated] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // ✅ Fetch related when active explanation changes
  useEffect(() => {
    const id = active?._id;
    if (!id) {
      setRelated([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingRelated(true);
      try {
        const res = await getRelatedConcepts(id);
        if (!cancelled)
          setRelated(Array.isArray(res.related) ? res.related : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setRelated([]);
      } finally {
        if (!cancelled) setLoadingRelated(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active?._id]);

  const relatedDisplay = useMemo(() => {
    if (loadingRelated) return ["Loading related topics…"];
    if (related.length) return related;
    return active?._id
      ? ["No related topics found."]
      : ["Generate an explanation to see related topics."];
  }, [loadingRelated, related, active?._id]);

  const label = complexityLabel(complexity);

  return (
    <aside
      className={[
        "w-[340px] flex flex-col min-h-0",
        "border-l border-slate-200 bg-white px-5 py-5",
        drawer ? "w-full border-l-0" : "",
      ].join(" ")}
    >
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
              aria-label="Toggle strict syllabus"
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
            When enabled, answers are generated ONLY from your uploaded lecture
            materials (RAG retrieval).
          </p>

          {/* ✅ Module dropdown only active when strict ON */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-600">
              Active Module
            </label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              disabled={!strict}
              className={[
                "mt-2 w-full h-10 rounded-lg border border-slate-300 px-3 text-sm bg-white",
                strict ? "text-slate-800" : "text-slate-400 bg-slate-50",
              ].join(" ")}
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {!strict && (
              <p className="mt-2 text-xs text-slate-500">
                Enable Strict Syllabus to filter retrieval by module.
              </p>
            )}
          </div>
        </Card>

        {/* ✅ Complexity */}
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              Complexity Level
            </p>
            <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {label}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={complexity}
            onChange={(e) => setComplexity(Number(e.target.value))}
            className="w-full mt-3 accent-slate-900"
          />

          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Novice</span>
            <span>Advanced</span>
          </div>

          <p className="mt-2 text-xs text-slate-600">
            Controls explanation depth (used in both Normal + Strict mode).
          </p>
        </Card>

        {/* Quiz (placeholder) */}
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

        {/* Related Concepts (dynamic) */}
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            Related Concepts
          </p>

          <div className="mt-3 space-y-2">
            {relatedDisplay.map((r) => (
              <button
                key={r}
                disabled={
                  loadingRelated ||
                  !active?._id ||
                  r.includes("Loading") ||
                  r.includes("No related") ||
                  r.includes("Generate")
                }
                onClick={() => setInput(r)}
                className={[
                  "w-full text-left text-sm rounded-lg px-3 py-2 transition",
                  loadingRelated || !active?._id
                    ? "text-slate-500"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>

          {active?._id && !loadingRelated && related.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Tip: click a topic to place it in the input box.
            </p>
          )}
        </Card>
      </div>
    </aside>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}
