export function ActionCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-6 border border-slate-200 bg-white
                 hover:border-indigo-200 hover:shadow-md transition"
    >
      <div
        className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center
                   justify-center text-indigo-600 mb-4"
      >
        {icon}
      </div>

      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
