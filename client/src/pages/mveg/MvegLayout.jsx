import React, { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MvegProvider, useMveg } from "./mvegStore";

import Sidebar from "../../components/mveg/Sidebar";
import Topbar from "../../components/mveg/Topbar";
import StudyTools from "../../components/mveg/StudyTools";
import Toast from "../../components/mveg/Toast";
import Drawer from "../../components/mveg/Drawer";

function InnerLayout() {
  const nav = useNavigate();
  const location = useLocation();

  const {
    items,
    active,
    input,
    setInput,
    loading,
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    onNew,
    onSelect,
    onDelete,
    onRename,
    onSubmit,
    toast,
    setToast,
  } = useMveg();

  const tab = useMemo(() => {
    if (location.pathname.includes("/library")) return "library";
    if (location.pathname.includes("/tools")) return "tools";
    return "explain";
  }, [location.pathname]);

  const breadcrumb = useMemo(() => {
    if (tab === "library") return { title: "MVEG", path: "Library" };
    if (tab === "tools") return { title: "MVEG", path: "Study Tools" };
    if (!active) return { title: "MVEG", path: "New Explanation" };
    return { title: "MVEG", path: active.title || active.question };
  }, [tab, active]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="h-screen flex min-h-0">
        {/* Desktop left sidebar */}
        <div className="hidden lg:flex min-h-0">
          <Sidebar
            tab={tab}
            items={items}
            activeId={active?._id}
            onNew={() => {
              onNew();
              nav("/mveg/explain");
            }}
            onSelect={(it) => {
              onSelect(it);
              nav("/mveg/explain");
            }}
            onDelete={onDelete}
            onRename={onRename}
            go={(to) => nav(to)}
          />
        </div>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Topbar
            breadcrumb={breadcrumb}
            onOpenLeft={() => setLeftOpen(true)}
            onOpenRight={() => setRightOpen(true)}
            onGoHome={() => nav("/")}
          />

          <div className="flex-1 flex min-w-0 min-h-0">
            {/* Center column */}
            <div className="flex-1 min-w-0 min-h-0 relative">
              {/* Scrollable content */}
              <div className="h-full min-h-0 overflow-y-auto pb-[96px]">
                <Outlet />
              </div>

              {/* Bottom input dock */}
              <div className="absolute left-0 right-0 bottom-0 border-t border-slate-200 bg-white shadow-sm">
                <form
                  onSubmit={onSubmit}
                  className="max-w-4xl mx-auto px-4 py-4"
                >
                  <div className="rounded-2xl border border-slate-300 bg-white p-3 flex items-center gap-3 shadow-sm">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 h-12 rounded-xl bg-white border border-slate-300 px-4 text-sm outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition"
                      placeholder="Ask a concept… (Press Enter to generate)"
                    />
                    <button
                      disabled={loading}
                      className="h-12 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-60"
                    >
                      {loading ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Desktop right tools */}
            <div className="hidden xl:flex min-h-0">
              <StudyTools answerText={active?.answer || ""} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile left drawer */}
      <Drawer open={leftOpen} onClose={() => setLeftOpen(false)} side="left">
        <Sidebar
          tab={tab}
          items={items}
          activeId={active?._id}
          onNew={() => {
            onNew();
            nav("/mveg/explain");
            setLeftOpen(false);
          }}
          onSelect={(it) => {
            onSelect(it);
            nav("/mveg/explain");
            setLeftOpen(false);
          }}
          onDelete={onDelete}
          onRename={onRename}
          go={(to) => {
            nav(to);
            setLeftOpen(false);
          }}
          drawer
        />
      </Drawer>

      {/* Mobile right drawer */}
      <Drawer open={rightOpen} onClose={() => setRightOpen(false)} side="right">
        <StudyTools answerText={active?.answer || ""} drawer />
      </Drawer>

      <Toast toast={toast} clear={() => setToast("")} />
    </div>
  );
}

export default function MvegLayout() {
  return (
    <MvegProvider>
      <InnerLayout />
    </MvegProvider>
  );
}
