import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  deleteExplanation,
  getExplanation,
  generateExplanation,
  listExplanations,
  renameExplanation,
} from "../../services/mvegApi";
import { copyToClipboard } from "../../utils/mvegClipboard";
import { instructionMap } from "../../components/mveg/ModeTabs";

const MvegCtx = createContext(null);

const VIEW_KEYS = ["simple", "analogy", "code", "summary"];

function normalizeViews(views = {}) {
  return {
    simple: views?.simple || "",
    analogy: views?.analogy || "",
    code: views?.code || "",
    summary: views?.summary || "",
  };
}

function hasAllViews(item) {
  return !!(
    item?.views &&
    VIEW_KEYS.every(
      (k) => typeof item.views[k] === "string" && item.views[k].length > 0,
    )
  );
}

export function MvegProvider({ children }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("simple");
  const [strict, setStrict] = useState(true);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState("");

  // mobile drawers
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  /* =========================
     Load library once
  ========================= */
  useEffect(() => {
    (async () => {
      try {
        const data = await listExplanations();
        setItems(Array.isArray(data) ? data.slice().reverse() : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* =========================
     ✅ Instant tab switching without re-generation
     When mode changes and active has cached views, update active.answer
  ========================= */
  useEffect(() => {
    if (!active?.views) return;

    const nextAnswer =
      active.views?.[mode] ||
      active.views?.[active.mode] ||
      active.views?.simple ||
      active.answer ||
      "";

    if (nextAnswer && nextAnswer !== active.answer) {
      setActive((prev) =>
        prev
          ? {
              ...prev,
              answer: nextAnswer,
            }
          : prev,
      );
    }
  }, [mode, active]);

  const onNew = () => {
    setActive(null);
    setInput("");
    setMode("simple");
    setToast("New explanation ready");
  };

  const onSelect = async (item) => {
    let picked = item;

    // If no answer OR no views (old record/list payload), fetch full doc
    if (!item?.answer || !item?.views) {
      try {
        picked = await getExplanation(item._id, item.mode || "simple");
      } catch {
        picked = item;
      }
    }

    const initialMode = picked.mode || "simple";
    const normalizedViews = picked.views ? normalizeViews(picked.views) : null;

    const finalPicked = {
      ...picked,
      views: normalizedViews,
      answer:
        (normalizedViews &&
          (normalizedViews[initialMode] || normalizedViews.simple)) ||
        picked.answer ||
        "",
      mode: initialMode,
    };

    setActive(finalPicked);
    setMode(initialMode); // auto-set active tab from saved item
    setLeftOpen(false);
  };

  const onDelete = async (id) => {
    const ok = confirm("Delete this explanation?");
    if (!ok) return;

    try {
      await deleteExplanation(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
      if (active?._id === id) setActive(null);
      setToast("Deleted");
    } catch (e) {
      console.error(e);
      setToast("Delete failed");
    }
  };

  const onRename = async (id, title) => {
    try {
      await renameExplanation(id, title);

      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, title } : x)));
      setActive((a) => (a?._id === id ? { ...a, title } : a));
    } catch {
      setToast("Rename failed");
    }
  };

  const onPickSample = (text) => setInput(text);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const msg = input.trim();
      if (!msg || loading) return;

      setLoading(true);
      try {
        const res = await generateExplanation({
          message: msg,
          instruction: instructionMap[mode], // backend can ignore this
          mode,
          strict,
        });

        // ✅ Out-of-scope handling (do NOT save in history)
        if (res?.outOfScope) {
          setActive({
            _id: null,
            question: res.question || msg,
            title: res.title || "Out of scope request",
            mode: mode || "simple",
            views: res.views ? normalizeViews(res.views) : null,
            answer: res.content || res.answer || "",
            createdAt: res.createdAt || new Date().toISOString(),
            outOfScope: true,
            outOfScopePayload: res.outOfScopePayload || null,
          });

          setMode(mode || "simple");
          setToast("Please ask a CS/SE/IT academic question");
          return;
        }

        const selectedMode = res.mode || mode || "simple";
        const views = res.views ? normalizeViews(res.views) : null;

        const selectedAnswer =
          (views && (views[selectedMode] || views.simple)) ||
          res.content ||
          res.answer ||
          "";

        const newItem = {
          _id: res.id,
          question: res.question || msg,
          title: res.title || msg.split(" ").slice(0, 6).join(" "),
          mode: selectedMode,
          views, // ✅ all views cached
          answer: selectedAnswer, // currently displayed selected view
          strict,
          createdAt: res.createdAt || new Date().toISOString(),
          outOfScope: false,
        };

        // Add to library/history only for valid academic generations
        setItems((prev) => [newItem, ...prev]);
        setActive(newItem);

        // Keep selected tab
        setMode(selectedMode);

        setInput("");
        setToast("Generated");
      } catch (err) {
        console.error(err);
        setToast("Generation failed");
      } finally {
        setLoading(false);
      }
    },
    [input, mode, strict, loading],
  );

  const onCopy = useCallback(async () => {
    if (!active?.answer) return;
    try {
      await copyToClipboard(active.answer);
      setToast("Copied");
    } catch {
      setToast("Copy failed");
    }
  }, [active]);

  const onExportPdf = () => setToast("PDF export: connect later");

  const onRegenerate = () => {
    if (!active?.question) return;
    setInput(active.question);
    setToast("Regenerate: hit Generate");
  };

  const value = useMemo(
    () => ({
      items,
      setItems,
      active,
      setActive,
      input,
      setInput,
      mode,
      setMode,
      strict,
      setStrict,
      loading,
      setLoading,
      toast,
      setToast,
      leftOpen,
      setLeftOpen,
      rightOpen,
      setRightOpen,

      onNew,
      onSelect,
      onDelete,
      onRename,
      onPickSample,
      onSubmit,
      onCopy,
      onExportPdf,
      onRegenerate,

      // optional helpers (useful for PP2 UI badges/indicators)
      hasActiveAllViews: hasAllViews(active),
      isOutOfScopeActive: !!active?.outOfScope,
    }),
    [
      items,
      active,
      input,
      mode,
      strict,
      loading,
      toast,
      leftOpen,
      rightOpen,
      onSubmit,
      onCopy,
    ],
  );

  return <MvegCtx.Provider value={value}>{children}</MvegCtx.Provider>;
}

export function useMveg() {
  const ctx = useContext(MvegCtx);
  if (!ctx) throw new Error("useMveg must be used inside MvegProvider");
  return ctx;
}
