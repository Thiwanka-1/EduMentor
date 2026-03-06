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
      <div className="rounded-lg border border-slate-300 bg-white px-5 py-3 shadow-md">
        <p className="text-sm text-slate-800 font-medium">{toast}</p>
      </div>
    </div>
  );
}
