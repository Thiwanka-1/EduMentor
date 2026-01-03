import React from "react";

export default function Drawer({ open, onClose, children, side = "left" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={[
          "absolute top-0 bottom-0 w-[86%] max-w-[360px] bg-white border-slate-200 shadow-2xl dark:bg-slate-950 dark:border-white/10",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
