import React from "react";
import { UploadCloud, BookOpen, Sliders, Brain, Sparkles } from "lucide-react";

function ToolCard({ icon: Icon, title, desc, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center">
          <Icon size={18} />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>

      <p className="text-sm text-slate-600 mb-4">{desc}</p>

      {children}
    </div>
  );
}

export default function MvegTools() {
  return (
    <section className="h-full overflow-y-auto px-6 py-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Study Tools</h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
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
            <button className="h-11 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition">
              Upload Files
            </button>
            <p className="mt-2 text-xs text-slate-500">
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
                    className="text-xs px-3 py-1 rounded-full border border-slate-300 bg-slate-100 text-slate-700"
                  >
                    {b}
                  </span>
                ),
              )}
            </div>
            <button className="mt-3 text-sm font-semibold text-slate-900 hover:underline">
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
              <div className="flex justify-between text-sm text-slate-700">
                <span>Complexity</span>
                <span className="font-semibold">Undergraduate</span>
              </div>
              <input type="range" className="w-full accent-slate-900" />
            </div>
          </ToolCard>

          {/* Reinforcement */}
          <ToolCard
            icon={Brain}
            title="Reinforcement Engine"
            desc="Generate quizzes, flashcards, and mastery checks from explanations."
          >
            <button className="h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition">
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
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700"
                >
                  {v}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Currently prompt-driven (upgradeable to multi-model)
            </p>
          </ToolCard>
        </div>
      </div>
    </section>
  );
}
