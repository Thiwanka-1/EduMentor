import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pencil, Trash2 } from "lucide-react";
import { useMveg } from "./mvegStore";

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

function Card({ item, onOpen, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || item.question);

  const commitRename = () => {
    setEditing(false);
    const newTitle = title.trim() || item.title || item.question;
    if (newTitle !== item.title) onRename(item._id, newTitle);
  };

  return (
    <div
      className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
                 hover:shadow-md transition cursor-pointer"
      onClick={() => onOpen(item)}
    >
      <span className="inline-flex items-center gap-2 mb-2">
        <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
          {item.mode || "simple"}
        </span>
        {item.strict ? (
          <span className="text-xs px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 font-semibold">
            Strict
          </span>
        ) : null}
      </span>

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
          className="w-full text-base font-semibold rounded-lg px-2 py-1
                     border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
        />
      ) : (
        <div className="text-base font-semibold text-slate-900 line-clamp-2">
          {item.title || item.question}
        </div>
      )}

      <div className="mt-2 text-sm text-slate-600 line-clamp-2">
        {item.answer || ""}
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {new Date(item.createdAt).toLocaleString()}
      </div>

      <div
        className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-indigo-50 transition"
          onClick={() => setEditing(true)}
        >
          <Pencil size={15} className="text-indigo-600" />
        </button>

        <button
          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-rose-100 transition"
          onClick={() => onDelete(item._id)}
        >
          <Trash2 size={15} className="text-rose-600" />
        </button>
      </div>
    </div>
  );
}

export default function MvegLibrary() {
  const navigate = useNavigate();
  const { items, onSelect, onDelete, onRename } = useMveg();
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...items].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    if (!q) return base;

    return base.filter(
      (x) =>
        (x.title || "").toLowerCase().includes(q) ||
        (x.question || "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const groups = useMemo(
    () => ({
      Today: filteredItems.filter((x) => isToday(x.createdAt)),
      Yesterday: filteredItems.filter((x) => isYesterday(x.createdAt)),
      Earlier: filteredItems.filter(
        (x) => !isToday(x.createdAt) && !isYesterday(x.createdAt),
      ),
    }),
    [filteredItems],
  );

  const onOpen = async (it) => {
    await onSelect(it);
    navigate("/mveg/explain");
  };

  return (
    <section className="h-full overflow-y-auto px-6 py-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm font-extrabold tracking-[0.2em] uppercase text-indigo-600 mb-2">
          Library
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Your saved explanations
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Manage and review your generated study materials.
        </p>

        <div className="mt-5 max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 h-11 shadow-sm">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search explanations…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {Object.entries(groups).map(
          ([label, arr]) =>
            arr.length > 0 && (
              <div key={label} className="mt-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-700">
                    {label}
                  </h2>
                  <span className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-500">
                    {arr.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
            ),
        )}

        {!filteredItems.length && (
          <div className="mt-20 text-center text-slate-500">
            No matching explanations found.
          </div>
        )}
      </div>
    </section>
  );
}
