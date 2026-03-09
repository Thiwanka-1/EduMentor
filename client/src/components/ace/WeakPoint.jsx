export function WeakPoint({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-slate-700">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="h-1.5 bg-slate-200 rounded-full">
        <div
          className="h-full bg-amber-400 transition-all duration-700 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
