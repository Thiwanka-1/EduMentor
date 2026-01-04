import React from "react";
import { Settings, PanelLeft, PanelRight, Home } from "lucide-react";

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
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300 min-w-0">
        {/* Mobile left drawer button */}
        <button
          onClick={onOpenLeft}
          className="lg:hidden h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/10 grid place-items-center"
          aria-label="Open menu"
        >
          <PanelLeft size={16} />
        </button>

        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
          {breadcrumb?.title || "MVEG"}
        </span>
        {breadcrumb?.path ? (
          <span className="opacity-70 truncate">› {breadcrumb.path}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {/* go home */}
        <button
          onClick={onGoHome}
          className="h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/10 grid place-items-center"
          aria-label="Home"
        >
          <Home size={16} />
        </button>

        {/* Mobile right drawer button */}
        <button
          onClick={onOpenRight}
          className="xl:hidden h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/10 grid place-items-center"
          aria-label="Open study tools"
        >
          <PanelRight size={16} />
        </button>

        <button
          className="h-9 w-9 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white transition
                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-white/10 grid place-items-center"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
