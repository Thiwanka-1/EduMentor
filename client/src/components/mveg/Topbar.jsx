import React from "react";
import { Settings, PanelLeft, PanelRight, Home } from "lucide-react";

export default function Topbar({
  breadcrumb,
  onOpenLeft,
  onOpenRight,
  onGoHome,
}) {
  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 bg-white">
      {/* Left Section */}
      <div className="flex items-center gap-3 text-sm text-slate-600 min-w-0">
        {/* Mobile left drawer button */}
        <button
          onClick={onOpenLeft}
          className="lg:hidden h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition grid place-items-center"
          aria-label="Open menu"
        >
          <PanelLeft size={16} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-slate-900 truncate">
            {breadcrumb?.title || "MVEG"}
          </span>

          {breadcrumb?.path ? (
            <span className="text-slate-400 truncate">› {breadcrumb.path}</span>
          ) : null}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <button
          onClick={onGoHome}
          className="h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition grid place-items-center"
          aria-label="Home"
        >
          <Home size={16} />
        </button>

        {/* Mobile right drawer */}
        <button
          onClick={onOpenRight}
          className="xl:hidden h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition grid place-items-center"
          aria-label="Open study tools"
        >
          <PanelRight size={16} />
        </button>

        {/* Settings */}
        <button
          className="h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition grid place-items-center"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
