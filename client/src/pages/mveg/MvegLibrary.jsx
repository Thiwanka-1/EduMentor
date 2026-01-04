import React from "react";
import { useNavigate } from "react-router-dom";
import { useMveg } from "./mvegStore";
import { groupByDay } from "../../utils/mvegGroup";

function Card({ item, onOpen }) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="text-left rounded-3xl border border-slate-200/70 bg-white/70 p-5
                 hover:shadow-[0_18px_70px_-55px_rgba(2,6,23,0.7)]
                 transition backdrop-blur
                 dark:border-white/10 dark:bg-slate-950/40"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200 capitalize
                     dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
        >
          {item.mode || "simple"}
        </span>
      </div>

      <div className="text-base font-semibold text-slate-900 dark:text-white">
        {item.title || item.question}
      </div>

      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
        {item.answer || ""}
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
      </div>
    </button>
  );
}

export default function MvegLibrary() {
  const navigate = useNavigate();
  const { items, onSelect } = useMveg();
  const groups = groupByDay(items);

  const onOpen = async (it) => {
    await onSelect(it); // ✅ sets active (and fetches full if needed)
    navigate("/mveg/explain"); // ✅ go to explanation page
  };

  return (
    <section className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Library
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Manage and review your generated study materials.
        </p>

        {Object.entries(groups).map(([label, arr]) =>
          arr.length ? (
            <div key={label} className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {label}
                </h2>
                <span
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200/70 text-slate-500
                             dark:border-white/10 dark:text-slate-400"
                >
                  {arr.length} item{arr.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {arr.map((it) => (
                  <Card key={it._id} item={it} onOpen={onOpen} />
                ))}
              </div>
            </div>
          ) : null
        )}

        {!items.length && (
          <div className="mt-16 text-center text-slate-500 dark:text-slate-400">
            No saved explanations yet.
          </div>
        )}
      </div>
    </section>
  );
}
