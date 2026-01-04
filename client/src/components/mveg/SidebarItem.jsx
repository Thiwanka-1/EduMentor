import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { truncate } from "../../utils/mvegText";

export default function SidebarItem({
  item,
  active,
  onSelect,
  onDelete,
  onRename,
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || item.question);

  const commitRename = () => {
    setEditing(false);
    const newTitle = title.trim() || item.title || item.question;
    onRename(item._id, newTitle);
  };

  return (
    <div
      className={[
        "group rounded-2xl border transition p-3 cursor-pointer",
        active
          ? "border-slate-900/40 bg-slate-900/5 dark:border-white/20 dark:bg-white/10"
          : "border-slate-200/70 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5",
      ].join(" ")}
      onClick={() => onSelect(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
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
              className="w-full border border-slate-200/70 rounded-xl px-2 py-1 text-sm outline-none
                         dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {truncate(item.title || item.question, 34)}
            </p>
          )}
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
            {item.mode || "simple"}
            {item.createdAt
              ? ` • ${new Date(item.createdAt).toLocaleString()}`
              : ""}
          </p>
        </div>

        <div
          className="flex gap-1 opacity-0 group-hover:opacity-100 transition"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="h-8 w-8 grid place-items-center rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10"
            onClick={() => setEditing(true)}
            title="Rename"
          >
            <Pencil size={15} className="text-slate-600 dark:text-slate-300" />
          </button>
          <button
            className="h-8 w-8 grid place-items-center rounded-xl hover:bg-rose-200/60 dark:hover:bg-rose-500/10"
            onClick={() => onDelete(item._id)}
            title="Delete"
          >
            <Trash2 size={15} className="text-rose-600 dark:text-rose-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
