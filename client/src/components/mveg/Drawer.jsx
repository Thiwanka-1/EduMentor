import React from "react";
import { X } from "lucide-react";

export default function Drawer({
  open,
  onClose,
  children,
  side = "left",
  title,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* panel */}
      <div
        className={[
          "absolute top-0 bottom-0 w-[86%] max-w-[360px]",
          "bg-white dark:bg-slate-950",
          "border-slate-200/70 dark:border-white/10",
          "shadow-2xl",
          "flex flex-col",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
        ].join(" ")}
      >
        {/* header with close */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200/70 dark:border-white/10">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title || (side === "left" ? "Menu" : "Study Tools")}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                       dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/10 grid place-items-center"
            aria-label="Close"
          >
            <X size={18} className="text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
