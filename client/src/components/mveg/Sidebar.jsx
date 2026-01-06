import React, { useMemo, useState } from "react";
import { Plus, Search, Sparkles, LayoutGrid, BookOpen } from "lucide-react";
import SidebarItem from "./SidebarItem";

/* =========================
   Date helpers
========================= */
function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
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

  /* =========================
     Filter + Sort + Group
  ========================= */
  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();

    const filtered = term
      ? items.filter((x) => {
          const t = (x.title || "").toLowerCase();
          const qu = (x.question || "").toLowerCase();
          return t.includes(term) || qu.includes(term);
        })
      : items;

    // newest first
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      today: sorted.filter((x) => isToday(x.createdAt)),
      yesterday: sorted.filter((x) => isYesterday(x.createdAt)),
      earlier: sorted.filter(
        (x) => !isToday(x.createdAt) && !isYesterday(x.createdAt)
      ),
    };
  }, [items, q]);

  return (
    <aside
      className={[
        "h-full min-h-0 w-[300px] shrink-0 p-4 flex flex-col gap-4",
        "border-r border-slate-200/70 dark:border-white/10",
        "bg-white/40 dark:bg-slate-950/40 backdrop-blur",
        drawer ? "w-full" : "",
      ].join(" ")}
    >
      {/* ================= Header ================= */}
      <div className="flex items-center gap-2 shrink-0">
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

      {/* ================= New ================= */}
      <button
        onClick={onNew}
        className="h-11 rounded-2xl bg-slate-900 text-white hover:bg-slate-800
                   dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
                   transition flex items-center justify-center gap-2 shrink-0"
      >
        <Plus size={16} /> New Explanation
      </button>

      {/* ================= Search ================= */}
      <div
        className="flex items-center gap-2 rounded-2xl border border-slate-200/70
                   bg-white/70 px-3 h-10 shrink-0
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

      {/* ================= Nav ================= */}
      <div className="flex flex-col gap-1 shrink-0">
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

      {/* ================= Library (scroll) ================= */}
      <div className="flex-1 min-h-0 flex flex-col mt-2">
        <div className="text-xs tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-2 shrink-0">
          MY EXPLANATIONS
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
          {/* Today */}
          {grouped.today.length > 0 && (
            <Section title="Today">
              {grouped.today.map((it) => (
                <SidebarItem
                  key={it._id}
                  item={it}
                  active={it._id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </Section>
          )}

          {/* Yesterday */}
          {grouped.yesterday.length > 0 && (
            <Section title="Yesterday">
              {grouped.yesterday.map((it) => (
                <SidebarItem
                  key={it._id}
                  item={it}
                  active={it._id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </Section>
          )}

          {/* Earlier */}
          {grouped.earlier.length > 0 && (
            <Section title="Earlier">
              {grouped.earlier.map((it) => (
                <SidebarItem
                  key={it._id}
                  item={it}
                  active={it._id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </Section>
          )}

          {/* Empty */}
          {!grouped.today.length &&
            !grouped.yesterday.length &&
            !grouped.earlier.length && (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
                No explanations found.
              </div>
            )}
        </div>
      </div>

      {/* ================= Footer ================= */}
      <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 shrink-0">
        EduMentor • MVEG Module
      </div>
    </aside>
  );
}

/* =========================
   Section helper
========================= */
function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
