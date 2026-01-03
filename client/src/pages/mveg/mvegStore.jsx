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
} from "../../services/mvegApi";
import { copyToClipboard } from "../../utils/mvegClipboard";
import { instructionMap } from "../../components/mveg/ModeTabs";

const MvegCtx = createContext(null);

export function MvegProvider({ children }) {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("simple");
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

  const onNew = () => {
    setActive(null);
    setInput("");
    setMode("simple");
    setToast("New explanation ready");
  };

  const onSelect = async (item) => {
    let picked = item;
    if (!item.answer) {
      try {
        picked = await getExplanation(item._id);
      } catch {
        picked = item;
      }
    }
    setActive(picked);
    setMode(picked.mode || "simple"); // ✅ auto-set mode from saved item
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

  const onRename = (id, title) => {
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, title } : x)));
    if (active?._id === id) setActive((a) => ({ ...a, title }));
    setToast("Renamed (local)");
  };

  const onPickSample = (text) => setInput(text);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const msg = input.trim();
      if (!msg || loading) return;

      setLoading(true);
      try {
        const { content, id } = await generateExplanation({
          message: msg,
          instruction: instructionMap[mode],
          mode,
        });

        const newItem = {
          _id: id,
          question: msg,
          title: msg.split(" ").slice(0, 6).join(" "),
          mode,
          answer: content,
          createdAt: new Date().toISOString(),
        };

        setItems((prev) => [newItem, ...prev]);
        setActive(newItem);
        setInput("");
        setToast("Generated");
      } catch (err) {
        console.error(err);
        setToast("Generation failed");
      } finally {
        setLoading(false);
      }
    },
    [input, mode, loading]
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
    }),
    [
      items,
      active,
      input,
      mode,
      loading,
      toast,
      leftOpen,
      rightOpen,
      onSubmit,
      onCopy,
    ]
  );

  return <MvegCtx.Provider value={value}>{children}</MvegCtx.Provider>;
}

export function useMveg() {
  const ctx = useContext(MvegCtx);
  if (!ctx) throw new Error("useMveg must be used inside MvegProvider");
  return ctx;
}
