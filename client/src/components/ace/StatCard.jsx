export function StatCard({ title, value, sub, percent, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 border border-white/5 bg-white/70 dark:bg-[#070b18]">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-2 w-full mt-4" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 border border-white/5 bg-white/70 dark:bg-[#070b18]">
      <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-3xl font-semibold">{value}</p>
        <span className="text-xs text-emerald-500">{sub}</span>
      </div>
      {percent && (
        <div className="mt-3 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
