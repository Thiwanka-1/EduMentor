import React from "react";
import { PanelLeft, PanelRight, Home, Settings } from "lucide-react";

export default function Topbar({
  breadcrumb,
  onOpenLeft,
  onOpenRight,
  onGoHome,
}) {
  return (
    <header
      className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-slate-200/70 bg-white/70 backdrop-blur
                       dark:border-white/10 dark:bg-slate-950/55"
    >
      <div className="flex items-center gap-3">
        {/* mobile: open left */}
        <button
          onClick={onOpenLeft}
          className="lg:hidden h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition grid place-items-center"
          aria-label="Open sidebar"
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">
            {breadcrumb?.title || "MVEG"}
          </span>
          {breadcrumb?.path ? (
            <span className="opacity-70">› {breadcrumb.path}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onGoHome}
          className="h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition grid place-items-center"
          title="Back to Home"
        >
          <Home size={16} />
        </button>

        {/* mobile: open right */}
        <button
          onClick={onOpenRight}
          className="xl:hidden h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition grid place-items-center"
          aria-label="Open study tools"
        >
          <PanelRight size={16} />
        </button>

        <button
          className="h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition grid place-items-center"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
