import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Plus,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCw,
  Layers,
  FileText,
  Sparkles,
  X,
  Clock,
  ArrowLeft,
  Save,
} from "lucide-react";
import {
  generateFlashcards,
  listFlashcardDecks,
  getFlashcardDeck,
  updateFlashcardDeck,
  deleteFlashcardDeck,
} from "../../services/aceApi";

// VIEW CONSTANTS
const VIEW = {
  DECKS: "decks",       // History: list of all decks
  CREATE: "create",     // Create/edit deck (card list view)
  STUDY: "study",       // Study mode (flip cards one at a time)
};

// MAIN COMPONENT
export default function AceFlashcards() {
  const [view, setView] = useState(VIEW.DECKS);
  const [decks, setDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(true);

  // Create / edit state
  const [deckName, setDeckName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [cards, setCards] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [editMode, setEditMode] = useState(true);

  // AI generation
  const [selectedFile, setSelectedFile] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [suggestedTerms, setSuggestedTerms] = useState([]);

  // Study mode
  const [studyCards, setStudyCards] = useState([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studyDeckName, setStudyDeckName] = useState("");

  // Saving
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  const loadDecks = useCallback(async () => {
    try {
      setLoadingDecks(true);
      const data = await listFlashcardDecks();
      setDecks(data.decks || []);
    } catch (err) {
      console.error("Failed to load decks:", err);
    } finally {
      setLoadingDecks(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const handleGenerate = async () => {
    if (!selectedFile && !pasteText.trim()) {
      setGenError("Upload a PDF or paste text first.");
      return;
    }

    setGenerating(true);
    setGenError("");

    try {
      const result = await generateFlashcards({
        file: selectedFile || undefined,
        text: pasteText.trim() || undefined,
        deckName: deckName || "Untitled Deck",
        description,
        tags,
      });

      // Populate the cards in the editor
      setCards(
        result.cards.map((c) => ({ term: c.term, definition: c.definition })),
        );
      setActiveDeckId(result.deckId);
      if (!deckName) setDeckName(result.deckName || "Untitled Deck");

      // Pull out some suggested terms from remaining AI knowledge
      const suggested = result.cards
        .slice(0, 3)
        .map((c) => c.term);
      setSuggestedTerms(suggested);

      setView(VIEW.CREATE);
      setEditMode(true);

      // Refresh history
      loadDecks();
    } catch (err) {
      setGenError(err.message || "Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setGenError("");
      // Auto-set deck name from file name
      if (!deckName) {
        const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        setDeckName(name);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setGenError("");
      if (!deckName) {
        const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        setDeckName(name);
      }
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const updateCard = (index, field, value) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
      );
  };

  const addCard = () => {
    setCards([...cards, { term: "", definition: "" }]);
  };

  const removeCard = (index) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const addSuggestedTerm = (term) => {
    setCards([...cards, { term, definition: "" }]);
    setSuggestedTerms(suggestedTerms.filter((t) => t !== term));
  };

  const handleSaveDeck = async () => {
    if (cards.length === 0) return;

    setSaving(true);
    try {
      if (activeDeckId) {
        await updateFlashcardDeck(activeDeckId, {
          deckName: deckName || "Untitled Deck",
          description,
          tags,
          cards: cards.filter((c) => c.term.trim()),
        });
      }
      loadDecks();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const openDeckForEdit = async (deckId) => {
    try {
      const data = await getFlashcardDeck(deckId);
      const d = data.deck;
      setActiveDeckId(d.id);
      setDeckName(d.deckName);
      setDescription(d.description || "");
      setTags(d.tags || []);
      setCards(d.cards || []);
      setEditMode(true);
      setView(VIEW.CREATE);
    } catch (err) {
      console.error("Failed to open deck:", err);
    }
  };

  const openDeckForStudy = async (deckId) => {
    try {
      const data = await getFlashcardDeck(deckId);
      const d = data.deck;
      setStudyCards(d.cards || []);
      setStudyDeckName(d.deckName);
      setStudyIndex(0);
      setFlipped(false);
      setView(VIEW.STUDY);
    } catch (err) {
      console.error("Failed to open deck for study:", err);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    try {
      await deleteFlashcardDeck(deckId);
      loadDecks();
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  const startNewDeck = () => {
    setActiveDeckId(null);
    setDeckName("");
    setDescription("");
    setTags([]);
    setCards([]);
    setSelectedFile(null);
    setPasteText("");
    setShowPasteBox(false);
    setGenError("");
    setSuggestedTerms([]);
    setEditMode(true);
    setView(VIEW.CREATE);
  };

  const studyNext = () => {
    if (studyIndex < studyCards.length - 1) {
      setStudyIndex(studyIndex + 1);
      setFlipped(false);
    }
  };

  const studyPrev = () => {
    if (studyIndex > 0) {
      setStudyIndex(studyIndex - 1);
      setFlipped(false);
    }
  };

  // RENDER: STUDY MODE
  if (view === VIEW.STUDY) {
    const card = studyCards[studyIndex];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => setView(VIEW.DECKS)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900
                     dark:hover:text-white transition"
        >
          <ArrowLeft size={16} /> Back to Decks
        </button>

        {/* Deck title */}
        <h2 className="text-xl font-bold">{studyDeckName}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Card {studyIndex + 1} of {studyCards.length}
        </p>

        {/* Card */}
        <div
          className="relative min-h-[280px] rounded-3xl border border-slate-200/70 dark:border-white/10
                     bg-white dark:bg-[#070b18] cursor-pointer select-none
                     flex items-center justify-center p-10
                     transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
          onClick={() => setFlipped(!flipped)}
        >
          {!flipped ? (
            <div className="text-center space-y-4">
              <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                Term
              </p>
              <p className="text-2xl font-bold">{card?.term}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                Click to reveal definition
              </p>
            </div>
) : (
            <div className="text-center space-y-4">
              <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Definition
              </p>
              <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                {card?.definition}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
                Click to see term
              </p>
            </div>
)}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={studyPrev}
            disabled={studyIndex === 0}
            className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10
                       dark:hover:bg-white/10 transition disabled:opacity-30
                       disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-1.5">
            {studyCards.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setStudyIndex(i);
                  setFlipped(false);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === studyIndex
                    ? "bg-indigo-500 scale-125"
                    : "bg-black/10 dark:bg-white/10 hover:bg-indigo-300"
                }`}
              />
))}
          </div>

          <button
            onClick={studyNext}
            disabled={studyIndex === studyCards.length - 1}
            className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10
                       dark:hover:bg-white/10 transition disabled:opacity-30
                       disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      );
  }

  // RENDER: CREATE / EDIT MODE
  if (view === VIEW.CREATE) {
    const validCards = cards.filter((c) => c.term.trim());
    return (
      <div className="flex gap-6">
        {/*  LEFT: AI Assistant Panel  */}
        <aside className="w-72 shrink-0 rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            AI Assistant
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Upload a PDF or paste notes to auto-generate flashcards.
          </p>

          {/* Upload zone */}
          <div
            className="rounded-xl border border-dashed border-slate-200 dark:border-white/20
                       p-6 text-center hover:border-indigo-500/40 transition cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 text-indigo-400" />
            <p className="text-sm font-medium">Upload PDF</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click or drag files here
            </p>

            {selectedFile && (
              <div className="mt-3 flex items-center gap-2 justify-center text-xs text-emerald-500">
                <FileText size={14} />
                {selectedFile.name}
              </div>
)}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-4 w-full py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold
                         hover:bg-indigo-700 transition"
            >
              Browse Files
            </button>
          </div>

          {/* Paste text toggle */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="w-full py-2 rounded-xl bg-black/5 dark:bg-white/5
                         hover:bg-black/10 dark:hover:bg-white/10 text-sm transition"
            >
              {showPasteBox ? "Hide Text Box" : "Paste Text"}
            </button>

            {showPasteBox && (
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your study notes here…"
                rows={5}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10
                           bg-black/5 dark:bg-white/5 p-3 text-xs resize-none
                           focus:outline-none focus:border-indigo-500/40"
              />
)}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500
                         text-white text-sm font-semibold hover:opacity-90 transition
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  Generating…
                </>
) : (
                "Generate"
)}
            </button>

            {genError && (
              <p className="text-xs text-red-500 mt-1">{genError}</p>
)}
          </div>

          {/* Suggested terms */}
          {suggestedTerms.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                Suggested Terms
              </p>
              {suggestedTerms.map((t) => (
                <div
                  key={t}
                  onClick={() => addSuggestedTerm(t)}
                  className="mb-2 rounded-xl bg-black/5 dark:bg-white/5 p-3 text-sm
                             cursor-pointer hover:bg-indigo-500/10 transition"
                >
                  <p className="font-medium text-indigo-500">{t}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click to add as a flashcard
                  </p>
                </div>
))}
            </div>
)}
        </aside>

        {/*  MAIN: Card Editor  */}
        <main className="flex-1 space-y-6">
          {/* Breadcrumb */}
          <p className="text-sm text-slate-500">
            <button
              onClick={() => setView(VIEW.DECKS)}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              Home
            </button>{" "}
            /{" "}
            <button
              onClick={() => setView(VIEW.DECKS)}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              Decks
            </button>{" "}
            /{" "}
            <span className="text-slate-900 dark:text-white">
              {activeDeckId ? "Edit Deck" : "New Deck"}
            </span>
          </p>

          {/* Header row */}
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="rounded-xl bg-white dark:bg-[#070b18] border border-slate-200/70
                             dark:border-white/10 px-4 py-2 text-sm focus:outline-none
                             focus:border-indigo-500/40"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Enter deck name…"
                />
                <input
                  className="rounded-xl bg-white dark:bg-[#070b18] border border-slate-200/70
                             dark:border-white/10 px-4 py-2 text-sm focus:outline-none
                             focus:border-indigo-500/40"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this deck about?"
                />
              </div>

              {/* Tags */}
              <div className="flex gap-2 items-center flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-400 text-xs
                               flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X size={10} />
                    </button>
                  </span>
))}
                <div className="flex gap-1">
                  <input
                    className="w-24 bg-transparent text-xs text-slate-500 outline-none
                               placeholder:text-slate-400"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    placeholder="+ Add Tag"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveDeck}
              disabled={saving || validCards.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white
                         dark:text-black text-sm font-semibold hover:opacity-90 transition
                         disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center gap-2 ml-4"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Deck"}
            </button>
          </div>

          {/* Cards section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                Cards{" "}
                <span className="text-slate-500 dark:text-slate-400 text-sm">
                  ({validCards.length} Cards)
                </span>
              </h3>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                  className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition ${
                    editMode
                      ? "bg-indigo-600/20 text-indigo-400"
                      : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => {
                    if (validCards.length > 0) {
                      setStudyCards(validCards);
                      setStudyDeckName(deckName || "Preview");
                      setStudyIndex(0);
                      setFlipped(false);
                      setView(VIEW.STUDY);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5
                             hover:bg-black/10 dark:hover:bg-white/10 text-sm
                             flex items-center gap-1 transition"
                >
                  <Eye size={14} /> Preview
                </button>
              </div>
            </div>

            {/* Card list */}
            {cards.map((card, i) => (
              <div
                key={i}
                className="relative rounded-2xl border border-slate-200/70 dark:border-white/10
                           bg-white dark:bg-[#070b18] grid grid-cols-2 overflow-hidden
                           group"
              >
                <div className="p-4 border-r border-slate-200/70 dark:border-white/10">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    TERM
                  </p>
                  {editMode ? (
                    <input
                      className="w-full bg-transparent outline-none text-sm"
                      value={card.term}
                      onChange={(e) => updateCard(i, "term", e.target.value)}
                      placeholder="Enter term"
                    />
) : (
                    <p className="text-sm font-medium">{card.term}</p>
)}
                </div>

                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    DEFINITION
                  </p>
                  {editMode ? (
                    <textarea
                      className="w-full bg-transparent outline-none text-sm resize-none"
                      value={card.definition}
                      onChange={(e) =>
                        updateCard(i, "definition", e.target.value)
                      }
                      placeholder="Enter definition"
                      rows={2}
                    />
) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {card.definition}
                    </p>
)}
                </div>

                {/* Delete button (visible on hover) */}
                {editMode && (
                  <button
                    onClick={() => removeCard(i)}
                    className="absolute right-3 top-3 p-1 rounded-lg opacity-0 group-hover:opacity-100
                               text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
)}
              </div>
))}

            {/* Add card */}
            {editMode && (
              <button
                onClick={addCard}
                className="w-full py-3 rounded-xl border border-dashed border-slate-200
                           dark:border-white/10 hover:border-indigo-500/40 text-sm
                           flex items-center justify-center gap-2 transition
                           hover:bg-indigo-500/5"
              >
                <Plus size={16} />
                Add Card
              </button>
)}

            <p className="text-xs text-slate-500 text-center">
              Tab to switch fields • Ctrl + Enter to save & next
            </p>
          </div>
        </main>
      </div>
      );
  }

  // RENDER: DECK HISTORY (default view)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers size={24} className="text-indigo-400" />
            Flashcards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, study, and review your flashcard decks.
          </p>
        </div>

        <button
          onClick={startNewDeck}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500
                     text-white text-sm font-semibold hover:opacity-90 transition
                     flex items-center gap-2"
        >
          <Plus size={16} />
          New Deck
        </button>
      </div>

      {/* Deck List */}
      {loadingDecks ? (
        <div className="flex items-center justify-center py-20">
          <RotateCw size={24} className="animate-spin text-indigo-400" />
          <span className="ml-3 text-sm text-slate-500">Loading decks…</span>
        </div>
) : decks.length === 0 ? (
        <div className="text-center py-20">
          <Layers
            size={48}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">No decks yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Upload a PDF or paste your notes to generate flashcards instantly.
          </p>
          <button
            onClick={startNewDeck}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500
                       text-white text-sm font-semibold hover:opacity-90 transition
                       inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Create Your First Deck
          </button>
        </div>
) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="rounded-2xl border border-slate-200/70 dark:border-white/10
                         bg-white dark:bg-[#070b18] p-5 space-y-3
                         hover:shadow-lg hover:shadow-indigo-500/5 transition group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{deck.deckName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {deck.cardCount} Cards
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                    deck.sourceType === "pdf"
                      ? "bg-blue-500/10 text-blue-400"
                      : deck.sourceType === "text"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-orange-500/10 text-orange-400"
                  }`}
                >
                  {deck.sourceType}
                </span>
              </div>

              {/* Tags */}
              {deck.tags && deck.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {deck.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/10
                                 text-indigo-400"
                    >
                      {tag}
                    </span>
))}
                </div>
)}

              {/* Time */}
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {new Date(deck.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => openDeckForStudy(deck.id)}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500
                             text-white text-xs font-semibold hover:opacity-90 transition
                             flex items-center justify-center gap-1"
                >
                  <Eye size={12} /> Study
                </button>
                <button
                  onClick={() => openDeckForEdit(deck.id)}
                  className="flex-1 py-2 rounded-xl bg-black/5 dark:bg-white/5
                             hover:bg-black/10 dark:hover:bg-white/10 text-xs font-medium
                             transition flex items-center justify-center gap-1"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteDeck(deck.id)}
                  className="py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5
                             hover:bg-red-500/10 text-red-400 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
))}
        </div>
)}
    </div>
    );
}
