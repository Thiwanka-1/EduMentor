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
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="h-screen flex">
        {/* Desktop left sidebar */}
        <div className="hidden lg:flex">
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
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            breadcrumb={breadcrumb}
            onOpenLeft={() => setLeftOpen(true)}
            onOpenRight={() => setRightOpen(true)}
            onGoHome={() => nav("/")}
          />

          <div className="flex-1 flex min-w-0">
            {/* Center column */}
            <div className="flex-1 min-w-0 relative">
              {/* content needs bottom padding because dock is fixed */}
              <div className="h-full pb-[96px]">
                <Outlet />
              </div>

              {/* ✅ Fixed dock only for MVEG explain flow */}
              <div className="absolute left-0 right-0 bottom-0 border-t border-slate-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
                <form
                  onSubmit={onSubmit}
                  className="max-w-4xl mx-auto px-3 sm:px-4 py-4"
                >
                  <div
                    className="rounded-3xl border border-slate-200/70 bg-white/70 p-3 flex items-center gap-3
                                  dark:border-white/10 dark:bg-slate-950/40"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 h-12 rounded-2xl bg-white border border-slate-200/70 px-4 text-sm outline-none
                                 dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100"
                      placeholder="Ask a concept… (Press Enter to generate)"
                    />
                    <button
                      disabled={loading}
                      className="h-12 px-5 sm:px-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800
                                 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition disabled:opacity-60"
                    >
                      {loading ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Desktop right tools */}
            <div className="hidden xl:flex">
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
