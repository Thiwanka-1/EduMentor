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
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 hover:bg-slate-50",
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
              className="w-full border border-slate-200 rounded-xl px-2 py-1 text-sm outline-none
                         focus:ring-2 focus:ring-indigo-200 bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-semibold text-slate-900 truncate">
              {truncate(item.title || item.question, 34)}
            </p>
          )}

          <p className="mt-0.5 text-xs text-slate-500 capitalize">
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
            className="h-8 w-8 grid place-items-center rounded-xl hover:bg-indigo-100 transition"
            onClick={() => setEditing(true)}
            title="Rename"
          >
            <Pencil size={15} className="text-indigo-600" />
          </button>

          <button
            className="h-8 w-8 grid place-items-center rounded-xl hover:bg-rose-100 transition"
            onClick={() => onDelete(item._id)}
            title="Delete"
          >
            <Trash2 size={15} className="text-rose-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
