import React, { useMemo, useState } from "react";
import { Plus, Search, Sparkles, LayoutGrid, BookOpen } from "lucide-react";
import SidebarItem from "./SidebarItem";

/* Date helpers */
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

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();

    const filtered = term
      ? items.filter((x) => {
          const t = (x.title || "").toLowerCase();
          const qu = (x.question || "").toLowerCase();
          return t.includes(term) || qu.includes(term);
        })
      : items;

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return {
      today: sorted.filter((x) => isToday(x.createdAt)),
      yesterday: sorted.filter((x) => isYesterday(x.createdAt)),
      earlier: sorted.filter(
        (x) => !isToday(x.createdAt) && !isYesterday(x.createdAt),
      ),
    };
  }, [items, q]);

  return (
    <aside
      className={[
        "h-full min-h-0 w-[300px] shrink-0 p-5 flex flex-col gap-4",
        "border-r border-slate-200 bg-white",
        drawer ? "w-full" : "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">
          M
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">MVEG</div>
          <div className="text-xs text-slate-500">Multi-View Explanation</div>
        </div>
      </div>

      {/* New Button */}
      <button
        onClick={onNew}
        className="h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center gap-2"
      >
        <Plus size={16} /> New Explanation
      </button>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 h-10">
        <Search size={16} className="text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-800"
          placeholder="Search library…"
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-1">
        <NavButton
          active={tab === "explain"}
          onClick={() => go("/mveg/explain")}
          icon={<Sparkles size={16} />}
          label="Explain"
        />
        <NavButton
          active={tab === "library"}
          onClick={() => go("/mveg/library")}
          icon={<LayoutGrid size={16} />}
          label="Library"
        />
        <NavButton
          active={tab === "tools"}
          onClick={() => go("/mveg/tools")}
          icon={<BookOpen size={16} />}
          label="Tools"
        />
      </div>

      {/* Library Scroll */}
      <div className="flex-1 min-h-0 flex flex-col mt-2">
        <div className="text-xs tracking-widest text-slate-500 font-semibold mb-2">
          MY EXPLANATIONS
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
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

          {!grouped.today.length &&
            !grouped.yesterday.length &&
            !grouped.earlier.length && (
              <div className="text-sm text-slate-500 py-10 text-center">
                No explanations found.
              </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-500 pt-2">EduMentor • MVEG Module</div>
    </aside>
  );
}

/* Navigation Button */
function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-10 rounded-xl px-3 flex items-center gap-2 text-sm transition",
        active
          ? "bg-slate-900 text-white"
          : "hover:bg-slate-100 text-slate-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

/* Section */
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
