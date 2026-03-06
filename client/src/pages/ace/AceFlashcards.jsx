import { Upload, Plus, Pencil } from "lucide-react";
import { useRef, useState } from "react";

export default function AceFlashcards() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [cards, setCards] = useState([
    {
      term: "Mitochondria",
      def: "Double-membrane-bound organelle found in most eukaryotic organisms.",
    },
    {
      term: "Photosynthesis",
      def: "Process used by plants to convert light energy into chemical energy.",
    },
  ]);

  const suggestedTerms = ["Mitochondria", "Ribosome", "Nucleus"];

  function handleBrowse() {
    fileInputRef.current.click();
  }

  function handleFiles(e) {
    const selected = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + " MB",
    }));
    setFiles(selected);
  }

  function addCard(term = "", def = "") {
    setCards((c) => [...c, { term, def }]);
  }

  function updateCard(i, field, value) {
    setCards((c) =>
      c.map((card, idx) =>
        idx === i ? { ...card, [field]: value } : card
      )
    );
  }

  function generateDemoCards() {
    addCard(
      "Cell Membrane",
      "Controls the movement of substances in and out of the cell."
    );
  }

  return (
    <div className="flex gap-6">
      {/* ================= LEFT ================= */}
      <aside className="w-72 rounded-3xl border border-white/10 bg-[#070b18] p-5">
        <h3 className="font-semibold mb-1">🤖 AI Assistant</h3>
        <p className="text-xs text-slate-400 mb-4">
          Upload a PDF to auto-generate flashcards.
        </p>

        <div className="rounded-xl border border-dashed border-white/20
                        p-6 text-center hover:border-indigo-500/40 transition">
          <Upload className="mx-auto mb-2 text-indigo-400" />
          <p className="text-sm font-medium">Upload PDF</p>

          <button
            onClick={handleBrowse}
            className="mt-4 w-full py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
          >
            Browse Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFiles}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((f) => (
              <div
                key={f.name}
                className="rounded-lg bg-white/5 p-2 text-xs"
              >
                {f.name} • {f.size}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <button className="w-full py-2 rounded-xl bg-white/5 text-sm">
            Paste Text
          </button>
          <button
            onClick={generateDemoCards}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-sm font-semibold"
          >
            Generate
          </button>
        </div>

        <div className="mt-6">
          <p className="text-xs text-slate-400 mb-2">SUGGESTED TERMS</p>

          {suggestedTerms.map((t) => (
            <div
              key={t}
              onClick={() => addCard(t, "")}
              className="mb-2 rounded-xl bg-white/5 p-3 text-sm cursor-pointer hover:bg-white/10"
            >
              {t}
            </div>
          ))}
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 space-y-6">
        <p className="text-sm text-slate-500">
          Home / Decks / <span className="text-white">New Deck</span>
        </p>

        <div className="flex justify-between items-center">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <input
              className="rounded-xl bg-[#070b18] border border-white/10 px-4 py-2 text-sm"
              defaultValue="Biology 101 - Cell Structures"
            />
            <input
              className="rounded-xl bg-[#070b18] border border-white/10 px-4 py-2 text-sm"
              placeholder="What is this deck about?"
            />
          </div>

          <button
            onClick={() => alert("Deck saved (demo)")}
            className="ml-4 px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold"
          >
            Save Deck
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              Cards <span className="text-slate-400">({cards.length})</span>
            </h3>

            <button className="px-3 py-1 rounded-lg bg-white/5 text-sm flex items-center gap-1">
              <Pencil size={14} /> Edit
            </button>
          </div>

          {cards.map((c, i) => (
            <FlashCard
              key={i}
              index={i + 1}
              {...c}
              onChange={(field, val) =>
                updateCard(i, field, val)
              }
            />
          ))}

          <button
            onClick={() => addCard()}
            className="w-full py-3 rounded-xl border border-dashed border-white/10
                       hover:border-indigo-500/40 text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Card
          </button>
        </div>
      </main>
    </div>
  );
}

/* ================= CARD ================= */

function FlashCard({ index, term, def, onChange }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#070b18]
                    grid grid-cols-2 overflow-hidden">
      <div className="p-4 border-r border-white/10">
        <p className="text-xs text-slate-400 mb-1">TERM</p>
        <input
          value={term}
          onChange={(e) => onChange("term", e.target.value)}
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-400 mb-1">DEFINITION</p>
        <textarea
          value={def}
          onChange={(e) => onChange("def", e.target.value)}
          className="w-full bg-transparent outline-none text-sm resize-none"
          rows={2}
        />
      </div>

      <span className="absolute right-3 top-3 text-xs text-slate-500">
        {index}
      </span>
    </div>
  );
}
