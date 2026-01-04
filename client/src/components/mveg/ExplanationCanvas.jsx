import React from "react";
import { Copy, FileDown, RefreshCw, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MarkdownView from "./MarkdownView";

export default function ExplanationCanvas({
  active,
  onCopy,
  onExportPdf,
  onRegenerate,
  loading,
}) {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* 🔧 FIX: bottom padding equals dock height */}
      <div className="max-w-4xl w-full mx-auto pb-[120px]">
        <div
          className="rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur overflow-hidden
                     dark:border-white/10 dark:bg-slate-950/40"
        >
          {/* Question */}
          <div className="px-6 py-6 border-b border-slate-200/70 dark:border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs tracking-widest font-semibold text-slate-500 dark:text-slate-400">
                  QUESTION
                </div>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                  {active?.question || "—"}
                </h1>
              </div>

              {/* 🎓 Avatar / Tutor Button */}
              <button
                onClick={() =>
                  navigate("/tutor", {
                    state: {
                      question: active?.question || "",
                      explanation: active?.answer || "",
                    },
                  })
                }
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl
                           bg-slate-900 text-white hover:bg-slate-800 transition
                           dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <UserCircle2 size={18} />
                Tutor
              </button>
            </div>
          </div>

          {/* Answer */}
          <div className="px-6 py-6">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-white/10 rounded" />
                <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-white/10 rounded" />
              </div>
            ) : (
              <MarkdownView text={active?.answer || ""} />
            )}
          </div>

          {/* Source material */}
          <div className="px-6 py-5 border-t border-slate-200/70 bg-slate-50/50 dark:border-white/10 dark:bg-white/5">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Source Material
            </div>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>
                • (Coming next) Lecture slide references + page/slide numbers
              </li>
              <li>
                • (Coming next) Book chapter/page citations from RAG chunks
              </li>
            </ul>
          </div>
        </div>

        {/* 🔧 FIX: Action bar now ABOVE dock */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onCopy}
            className="h-11 px-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                       flex items-center gap-2
                       dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/5"
          >
            <Copy size={16} /> Copy
          </button>

          <button
            onClick={onExportPdf}
            className="h-11 px-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                       flex items-center gap-2
                       dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/5"
          >
            <FileDown size={16} /> Export PDF
          </button>

          <div className="flex-1" />

          <button
            onClick={onRegenerate}
            className="h-11 px-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition
                       flex items-center gap-2
                       dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <RefreshCw size={16} /> Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
