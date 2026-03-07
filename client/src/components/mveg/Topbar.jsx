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
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenLeft}
          className="lg:hidden h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center"
          aria-label="Open menu"
        >
          <PanelLeft size={16} className="text-slate-700" />
        </button>

        {/* Brand + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mini brand mark */}
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-500 to-cyan-400 text-white grid place-items-center shadow-sm">
            <span className="text-sm font-extrabold">M</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-slate-900 truncate">
                {breadcrumb?.title || "MVEG"}
              </span>
              {breadcrumb?.path ? (
                <span className="text-slate-400 truncate">
                  › {breadcrumb.path}
                </span>
              ) : null}
            </div>

            {/* subtle accent line */}
            <div className="h-[2px] w-20 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-400 mt-1" />
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGoHome}
          className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center"
          aria-label="Home"
        >
          <Home size={16} className="text-slate-700" />
        </button>

        <button
          onClick={onOpenRight}
          className="xl:hidden h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition grid place-items-center"
          aria-label="Open study tools"
        >
          <PanelRight size={16} className="text-slate-700" />
        </button>
      </div>
    </header>
  );
}
