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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className={[
          "absolute top-0 bottom-0 w-[86%] max-w-[360px]",
          "bg-white border-slate-200 shadow-xl",
          "flex flex-col",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
        ].join(" ")}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white">
          <div className="text-sm font-semibold text-slate-900">
            {title || (side === "left" ? "Menu" : "Study Tools")}
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition grid place-items-center"
            aria-label="Close"
          >
            <X size={18} className="text-slate-700" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
