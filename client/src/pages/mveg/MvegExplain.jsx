import React from "react";
import { useMveg } from "./mvegStore";
import ModeTabs from "../../components/mveg/ModeTabs";
import EmptyState from "../../components/mveg/EmptyState";
import ExplanationCanvas from "../../components/mveg/ExplanationCanvas";

export default function MvegExplain() {
  const {
    active,
    loading,
    mode,
    setMode,
    onPickSample,
    onCopy,
    onExportPdf,
    onRegenerate,
  } = useMveg();

  return (
    <section className="h-full flex flex-col min-w-0 bg-slate-50">
      {/* Mode Tabs Area */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto flex justify-center">
          <ModeTabs mode={mode} setMode={setMode} />
        </div>
      </div>

      {/* Content Area */}
      {!active ? (
        <div className="flex-1 min-w-0">
          <EmptyState onPick={onPickSample} />
        </div>
      ) : (
        <ExplanationCanvas
          active={active}
          loading={loading}
          onCopy={onCopy}
          onExportPdf={onExportPdf}
          onRegenerate={onRegenerate}
        />
      )}
    </section>
  );
}
