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
      <div className="rounded-2xl border border-indigo-100 bg-white/95 backdrop-blur px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
          <p className="text-sm font-semibold text-slate-800">{toast}</p>
        </div>
      </div>
    </div>
  );
}
