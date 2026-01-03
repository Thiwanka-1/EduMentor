import React, { useEffect } from "react";

export default function Toast({ toast, clear }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2400);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="rounded-xl border border-slate-200/70 bg-white/90 backdrop-blur px-4 py-2
                      dark:border-white/10 dark:bg-slate-950/80"
      >
        <p className="text-sm text-slate-800 dark:text-slate-100">{toast}</p>
      </div>
    </div>
  );
}
