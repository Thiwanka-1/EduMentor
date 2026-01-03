import React, { useMemo, useState } from "react";
import { Plus, Search, Sparkles, LayoutGrid, BookOpen } from "lucide-react";
import SidebarItem from "./SidebarItem";

export default function Sidebar({
  items,
  activeId,
  onNew,
  onSelect,
  onDelete,
  onRename,
  tab,
  go,
  drawer = false,
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((x) => {
      const t = (x.title || "").toLowerCase();
      const qu = (x.question || "").toLowerCase();
      return t.includes(term) || qu.includes(term);
    });
  }, [items, q]);

  return (
    <aside className="w-[300px] shrink-0 p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 grid place-items-center font-bold">
          M
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            MVEG
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Multi-View Explanation
          </div>
        </div>
      </div>

      <button
        onClick={onNew}
        className="h-11 rounded-2xl bg-slate-900 text-white hover:bg-slate-800
                   dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition flex items-center justify-center gap-2"
      >
        <Plus size={16} /> New Explanation
      </button>

      <div
        className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 h-10
                      dark:border-white/10 dark:bg-slate-950/40"
      >
        <Search size={16} className="text-slate-500 dark:text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100"
          placeholder="Search library…"
        />
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => go("/mveg/explain")}
          className={[
            "h-10 rounded-2xl px-3 flex items-center gap-2 text-sm transition",
            tab === "explain"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200",
          ].join(" ")}
        >
          <Sparkles size={16} /> Explain
        </button>

        <button
          onClick={() => go("/mveg/library")}
          className={[
            "h-10 rounded-2xl px-3 flex items-center gap-2 text-sm transition",
            tab === "library"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200",
          ].join(" ")}
        >
          <LayoutGrid size={16} /> Library
        </button>

        <button
          onClick={() => go("/mveg/tools")}
          className={[
            "h-10 rounded-2xl px-3 flex items-center gap-2 text-sm transition",
            tab === "tools"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200",
          ].join(" ")}
        >
          <BookOpen size={16} /> Tools
        </button>
      </div>

      <div className="mt-2">
        <div className="text-xs tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-2">
          MY EXPLANATIONS
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {filtered.map((it) => (
            <SidebarItem
              key={it._id}
              item={it}
              active={it._id === activeId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}

          {!filtered.length && (
            <div className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
              No explanations found.
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto text-xs text-slate-500 dark:text-slate-400 pt-2">
        EduMentor • MVEG Module
      </div>
    </aside>
  );
}
