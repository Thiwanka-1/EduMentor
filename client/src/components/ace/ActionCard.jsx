export function ActionCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-6 border border-white/5
                 bg-white/70 dark:bg-[#070b18]
                 hover:border-indigo-500/30 transition"
    >
    <div className="rounded-2xl p-6 border border-white/5 bg-white/70 dark:bg-[#070b18]
                    hover:border-indigo-500/30 transition">
      <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center
                      justify-center text-indigo-500 mb-4">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        {desc}
      </p>
    </div>
    </div>
  );
}
