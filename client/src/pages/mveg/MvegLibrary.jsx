import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pencil, Trash2 } from "lucide-react";
import { useMveg } from "./mvegStore";

/* =========================
   Date helpers
========================= */
function isToday(date) {
  const d = new Date(date);
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

function isYesterday(date) {
  const d = new Date(date);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return (
    d.getDate() === y.getDate() &&
    d.getMonth() === y.getMonth() &&
    d.getFullYear() === y.getFullYear()
  );
}

/* =========================
   Card
========================= */
function Card({ item, onOpen, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || item.question);

  const commitRename = () => {
    setEditing(false);
    const newTitle = title.trim() || item.title || item.question;
    if (newTitle !== item.title) {
      onRename(item._id, newTitle);
    }
  };

  return (
    <div
      className="group relative rounded-3xl border border-slate-200/70 bg-white/70 p-5
                 hover:shadow-[0_18px_70px_-55px_rgba(2,6,23,0.7)]
                 transition backdrop-blur cursor-pointer
                 dark:border-white/10 dark:bg-slate-950/40"
      onClick={() => onOpen(item)}
    >
      {/* Mode */}
      <span
        className="inline-block mb-2 text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600
                       dark:bg-white/10 dark:text-slate-200"
      >
        {item.mode || "simple"}
      </span>

      {/* Title */}
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setEditing(false);
              setTitle(item.title || item.question);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-base font-semibold rounded-xl px-2 py-1
                     border border-slate-200/70 outline-none
                     dark:border-white/10 dark:bg-slate-950/40 dark:text-white"
        />
      ) : (
        <div className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2">
          {item.title || item.question}
        </div>
      )}

      {/* Preview */}
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
        {item.answer || ""}
      </div>

      {/* Date */}
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {new Date(item.createdAt).toLocaleString()}
      </div>

      {/* Actions */}
      <div
        className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="h-8 w-8 grid place-items-center rounded-xl
                     hover:bg-slate-200/60 dark:hover:bg-white/10"
          onClick={() => setEditing(true)}
        >
          <Pencil size={15} />
        </button>

        <button
          className="h-8 w-8 grid place-items-center rounded-xl
                     hover:bg-rose-200/60 dark:hover:bg-rose-500/10"
          onClick={() => onDelete(item._id)}
        >
          <Trash2 size={15} className="text-rose-600" />
        </button>
      </div>
    </div>
  );
}

/* =========================
   Library Page
========================= */
export default function MvegLibrary() {
  const navigate = useNavigate();
  const { items, onSelect, onDelete, onRename } = useMveg();
  const [query, setQuery] = useState("");

  /* Filter + sort */
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...items].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (!q) return base;

    return base.filter(
      (x) =>
        (x.title || "").toLowerCase().includes(q) ||
        (x.question || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  /* Group */
  const groups = useMemo(
    () => ({
      Today: filteredItems.filter((x) => isToday(x.createdAt)),
      Yesterday: filteredItems.filter((x) => isYesterday(x.createdAt)),
      Earlier: filteredItems.filter(
        (x) => !isToday(x.createdAt) && !isYesterday(x.createdAt)
      ),
    }),
    [filteredItems]
  );

  const onOpen = async (it) => {
    await onSelect(it);
    navigate("/mveg/explain");
  };

  return (
    <section className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Library
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Manage and review your generated study materials.
        </p>

        {/* 🔍 Search */}
        <div className="mt-4 max-w-md">
          <div
            className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 h-11
                          dark:border-white/10 dark:bg-slate-950/40"
          >
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search explanations…"
              className="flex-1 bg-transparent outline-none text-sm dark:text-white"
            />
          </div>
        </div>

        {/* Groups */}
        {Object.entries(groups).map(
          ([label, arr]) =>
            arr.length > 0 && (
              <div key={label} className="mt-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {label}
                  </h2>
                  <span
                    className="text-xs px-2 py-1 rounded-lg border border-slate-200/70
                                   dark:border-white/10 text-slate-500"
                  >
                    {arr.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {arr.map((it) => (
                    <Card
                      key={it._id}
                      item={it}
                      onOpen={onOpen}
                      onDelete={onDelete}
                      onRename={onRename}
                    />
                  ))}
                </div>
              </div>
            )
        )}

        {!filteredItems.length && (
          <div className="mt-20 text-center text-slate-500 dark:text-slate-400">
            No matching explanations found.
          </div>
        )}
      </div>
    </section>
  );
}
