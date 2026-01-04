import { Upload, Plus, Pencil } from "lucide-react";

export default function AceFlashcards() {
  return (
    <div className="flex gap-6">
      {/* ================= LEFT AI ASSISTANT ================= */}
      <aside className="w-72 rounded-3xl border border-white/10 bg-[#070b18] p-5">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          🤖 AI Assistant
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Upload a PDF or paste notes to auto-generate flashcards.
        </p>

        {/* Upload */}
        <div
          className="rounded-xl border border-dashed border-white/20
                     p-6 text-center hover:border-indigo-500/40 transition"
        >
          <Upload className="mx-auto mb-2 text-indigo-400" />
          <p className="text-sm font-medium">Upload PDF</p>
          <p className="text-xs text-slate-400 mt-1">
            Click or drag files here
          </p>

          <button
            className="mt-4 w-full py-2 rounded-xl bg-indigo-600
                       text-white text-sm font-semibold"
          >
            Browse Files
          </button>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm">
            Paste Text
          </button>
          <button className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-sm font-semibold">
            Generate
          </button>
        </div>

        {/* Suggested terms */}
        <div className="mt-6">
          <p className="text-xs text-slate-400 mb-2">
            SUGGESTED TERMS
          </p>

          {[
            "Mitochondria",
            "Ribosome",
            "Nucleus",
          ].map((t) => (
            <div
              key={t}
              className="mb-2 rounded-xl bg-white/5 p-3 text-sm"
            >
              <p className="font-medium">{t}</p>
              <p className="text-xs text-slate-400">
                Click to add as a flashcard
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 space-y-6">
        {/* Breadcrumb */}
        <p className="text-sm text-slate-500">
          Home / Decks / <span className="text-white">New Deck</span>
        </p>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <input
                className="rounded-xl bg-[#070b18] border border-white/10
                           px-4 py-2 text-sm"
                value="Biology 101 - Cell Structures"
                readOnly
              />
              <input
                className="rounded-xl bg-[#070b18] border border-white/10
                           px-4 py-2 text-sm"
                placeholder="What is this deck about?"
              />
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-600/20
                               text-indigo-400 text-xs">
                Biology ×
              </span>
              <button className="text-xs text-slate-400">
                + Add Tag
              </button>
            </div>
          </div>

          <button className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold">
            Save Deck
          </button>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Cards <span className="text-slate-400 text-sm">(12 Cards)</span>
            </h3>

            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg bg-white/5 text-sm flex items-center gap-1">
                <Pencil size={14} /> Edit
              </button>
              <button className="px-3 py-1 rounded-lg bg-white/5 text-sm">
                Preview
              </button>
            </div>
          </div>

          {/* Card Item */}
          {[
            {
              term: "Mitochondria",
              def: "Double-membrane-bound organelle found in most eukaryotic organisms.",
            },
            {
              term: "Photosynthesis",
              def: "Process used by plants and other organisms to convert light energy into chemical energy.",
            },
          ].map((c, i) => (
            <FlashCard key={i} index={i + 1} {...c} />
          ))}

          {/* Empty Card */}
          <FlashCard index={3} empty />

          {/* Add Card */}
          <button
            className="w-full py-3 rounded-xl border border-dashed
                       border-white/10 hover:border-indigo-500/40
                       text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Card
          </button>

          <p className="text-xs text-slate-500 text-center">
            Tab to switch fields • Ctrl + Enter to save & next
          </p>
        </div>
      </main>
    </div>
  );
}

/* ================= FLASHCARD ================= */

function FlashCard({ index, term, def, empty }) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-[#070b18]
                 grid grid-cols-2 overflow-hidden"
    >
      <div className="p-4 border-r border-white/10">
        <p className="text-xs text-slate-400 mb-1">TERM</p>
        <input
          className="w-full bg-transparent outline-none text-sm"
          value={term || ""}
          placeholder="Enter term"
          readOnly={!empty}
        />
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-400 mb-1">DEFINITION</p>
        <textarea
          className="w-full bg-transparent outline-none text-sm resize-none"
          value={def || ""}
          placeholder="Enter definition"
          rows={2}
          readOnly={!empty}
        />
      </div>

      <span className="absolute right-3 top-3 text-xs text-slate-500">
        {index}
      </span>
    </div>
  );
}
