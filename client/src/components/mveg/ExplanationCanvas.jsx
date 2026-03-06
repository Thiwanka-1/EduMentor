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

  // current displayed answer (supports new multi-view + old records)
  const currentAnswer =
    active?.answer ||
    active?.views?.[active?.mode || "simple"] ||
    active?.views?.simple ||
    "";

  return (
    <div className="h-full flex flex-col px-6 py-8 bg-slate-50">
      <div className="max-w-4xl w-full mx-auto pb-[120px]">
        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Question Header */}
          <div className="px-6 py-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs tracking-widest font-semibold text-slate-500">
                  QUESTION
                </div>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 leading-snug">
                  {active?.question || "—"}
                </h1>
              </div>

              {/* Tutor Button */}
              <button
                onClick={() =>
                  navigate("/tutor", {
                    state: {
                      question: active?.question || "",
                      explanation: currentAnswer,
                    },
                  })
                }
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl
                           bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                <UserCircle2 size={18} />
                Tutor
              </button>
            </div>
          </div>

          {/* Answer Section */}
          <div className="px-6 py-6 text-slate-800">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 rounded" />
              </div>
            ) : (
              <MarkdownView text={currentAnswer} />
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onCopy}
            className="h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition flex items-center gap-2 shadow-sm"
          >
            <Copy size={16} /> Copy
          </button>

          <button
            onClick={onExportPdf}
            className="h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition flex items-center gap-2 shadow-sm"
          >
            <FileDown size={16} /> Export PDF
          </button>

          <div className="flex-1" />

          <button
            onClick={onRegenerate}
            className="h-11 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-2"
          >
            <RefreshCw size={16} /> Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
