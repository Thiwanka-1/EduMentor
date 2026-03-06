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
import { exportMvegPdf } from "../../utils/mvegPdf";

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

  // ✅ strict syllabus (RAG)
  const [strict, setStrict] = useState(true);

  // ✅ NEW: module + complexity (global)
  const [module, setModule] = useState("ALL");
  const [complexity, setComplexity] = useState(55);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // mobile drawers
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // load library once
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

  // ✅ Instant switching (no regen)
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
    setMode(initialMode);
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
          instruction: instructionMap[mode],
          mode,
          strict,

          // ✅ send new controls
          module,
          complexity,
        });

        // out-of-scope handling
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
          });
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
          views,
          answer: selectedAnswer,
          strict,
          module,
          complexity,
          createdAt: res.createdAt || new Date().toISOString(),
          outOfScope: false,
        };

        setItems((prev) => [newItem, ...prev]);
        setActive(newItem);
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
    [input, mode, strict, module, complexity, loading],
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

  const onExportPdf = () => {
    if (!active?.question) {
      setToast("Nothing to export");
      return;
    }

    const title = active?.title || active?.question || "MVEG Explanation";
    const answer =
      active?.answer || active?.views?.[mode] || active?.views?.simple || "";

    const complexityLabel =
      complexity <= 30
        ? "Novice"
        : complexity <= 70
          ? "Undergraduate"
          : "Advanced";

    exportMvegPdf({
      title,
      question: active.question,
      answer,
      meta: {
        mode,
        strict,
        module,
        complexity,
        complexityLabel,
      },
    });

    setToast("PDF downloaded");
  };

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

      // ✅ expose controls to StudyTools
      module,
      setModule,
      complexity,
      setComplexity,

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

      hasActiveAllViews: hasAllViews(active),
    }),
    [
      items,
      active,
      input,
      mode,
      strict,
      module,
      complexity,
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
