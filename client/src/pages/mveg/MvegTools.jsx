import React from "react";
import { UploadCloud, BookOpen, Sliders, Brain, Sparkles } from "lucide-react";

function ToolCard({ icon: Icon, title, desc, children }) {
  return (
    <div
      className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 backdrop-blur
                 shadow-[0_18px_70px_-55px_rgba(2,6,23,0.6)]
                 dark:border-white/10 dark:bg-slate-950/40"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center
                     dark:bg-white dark:text-slate-900"
        >
          <Icon size={18} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{desc}</p>

      {children}
    </div>
  );
}

export default function MvegTools() {
  return (
    <section className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Study Tools
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Configure how explanations are generated, reinforced, and aligned
            with your syllabus and learning level.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Materials */}
          <ToolCard
            icon={UploadCloud}
            title="Upload Study Materials"
            desc="Upload lecture slides, PDFs, or reference books to improve explanation accuracy using retrieval-based context."
          >
            <button
              className="h-11 px-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition
                         dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Upload Files
            </button>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Supported formats: PDF, PPTX (RAG-ready)
            </p>
          </ToolCard>

          {/* Reference Books */}
          <ToolCard
            icon={BookOpen}
            title="Reference Books"
            desc="Manage trusted textbooks used as grounding sources for explanations."
          >
            <div className="flex flex-wrap gap-2">
              {["DSA Handbook", "Operating Systems", "Computer Networks"].map(
                (b) => (
                  <span
                    key={b}
                    className="text-xs px-3 py-1 rounded-full border border-slate-200/70 bg-white/70
                               dark:border-white/10 dark:bg-slate-950/40"
                  >
                    {b}
                  </span>
                )
              )}
            </div>
            <button className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              Manage books →
            </button>
          </ToolCard>

          {/* Explanation Controls */}
          <ToolCard
            icon={Sliders}
            title="Explanation Controls"
            desc="Control depth, strictness, and academic level of generated explanations."
          >
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Complexity</span>
                <span className="font-semibold">Undergraduate</span>
              </div>
              <input type="range" className="w-full" />
            </div>
          </ToolCard>

          {/* Reinforcement */}
          <ToolCard
            icon={Brain}
            title="Reinforcement Engine"
            desc="Generate quizzes, flashcards, and mastery checks from explanations."
          >
            <button
              className="h-11 px-4 rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white
                         dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/5 transition"
            >
              Generate Quiz
            </button>
          </ToolCard>

          {/* Multi-View Control */}
          <ToolCard
            icon={Sparkles}
            title="Multi-View Strategy"
            desc="Choose how different explanation views are generated and combined."
          >
            <div className="flex flex-wrap gap-2">
              {["Simple", "Analogy", "Code", "Visual"].map((v) => (
                <span
                  key={v}
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700
                             dark:bg-white/10 dark:text-slate-200"
                >
                  {v}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Currently prompt-driven (upgradeable to multi-model)
            </p>
          </ToolCard>
        </div>
      </div>
    </section>
  );
}
