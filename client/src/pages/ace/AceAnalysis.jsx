import {
  Flame,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Sigma,
  Beaker,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AceAnalysis() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Progress Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track your mastery and identify areas for improvement.
          </p>
        </div>

        <div className="flex gap-2">
          {["7 Days", "30 Days", "All Time"].map((t, i) => (
            <button
              key={t}
              className={`px-4 py-2 rounded-xl text-sm font-medium
                ${
                  i === 1
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="MASTERY SCORE"
          value="78%"
          sub="+5%"
          icon={<TrendingUp />}
        />
        <StatCard
          title="QUESTIONS"
          value="1,245"
          sub="+120"
          icon={<HelpCircle />}
        />
        <StatCard
          title="STREAK"
          value="12 Days"
          sub="Active"
          icon={<Flame />}
        />
      </div>

      {/* ================= MIDDLE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#070b18] p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Performance Over Time</h3>
              <p className="text-xs text-slate-400">
                Accuracy trend over the last 30 days
              </p>
            </div>

            <span className="text-xs px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-400">
              +15% Improvement
            </span>
          </div>

          {/* Fake chart */}
          <div className="h-56 rounded-xl bg-gradient-to-t
                          from-indigo-600/10 to-transparent
                          relative overflow-hidden">
            <div className="absolute inset-0 flex items-end px-6 pb-6">
              <div className="w-full h-[60%] bg-indigo-500/30 rounded-xl blur-sm" />
            </div>

            <div className="absolute bottom-4 left-6 right-6
                            flex justify-between text-xs text-slate-500">
              {["Week 1", "Week 2", "Week 3", "Week 4"].map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Critical Weak Points */}
        <div className="rounded-3xl border border-white/10 bg-[#070b18] p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" size={18} />
            <h3 className="font-semibold">Critical Weak Points</h3>
          </div>

          <Weak label="Organic Chemistry" value={32} />
          <Weak label="Thermodynamics" value={45} />
          <Weak label="Linear Algebra" value={58} />
          <Weak label="Fluid Dynamics" value={62} />

          <button className="w-full mt-5 py-2 rounded-xl
                             bg-white/5 hover:bg-white/10
                             text-sm font-semibold">
            View All Topics
          </button>
        </div>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#070b18] p-6">
          <span className="text-xs px-2 py-1 rounded-full
                           bg-indigo-600/15 text-indigo-400">
            Recommended Action
          </span>

          <h3 className="mt-3 text-xl font-semibold">
            Weak Points Refresher
          </h3>

          <p className="text-slate-400 mt-2 max-w-xl">
            We’ve generated a targeted session with 20 questions focusing on
            <span className="text-white font-medium">
              {" "}Organic Chemistry{" "}
            </span>
            and
            <span className="text-white font-medium">
              {" "}Thermodynamics
            </span>.
          </p>

          <div className="mt-5 flex gap-4">
            <button 
            onClick={() => navigate("/ace/session")}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">
              ▶ Start Session
            </button>
            <button className="text-sm text-slate-400 hover:text-white">
              Customize
            </button>
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="rounded-3xl border border-white/10 bg-[#070b18] p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Topic Mastery</h3>
            <button className="text-xs text-slate-400 hover:text-white">
              Details
            </button>
          </div>

          <Topic
            icon={<Sigma />}
            label="Calculus II"
            value={92}
          />
          <Topic
            icon={<Beaker />}
            label="Physics Mechanics"
            value={88}
          />
          <Topic
            icon={<BookOpen />}
            label="World History"
            value={75}
          />
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ title, value, sub, icon }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#070b18] p-6">
      <div className="flex justify-between items-start">
        <p className="text-xs text-slate-400">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20
                        flex items-center justify-center text-indigo-400">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        <span className="text-xs text-emerald-400 mb-1">
          {sub}
        </span>
      </div>
    </div>
  );
}

function Weak({ label, value }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="text-red-400">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full">
        <div
          className="h-full bg-red-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Topic({ icon, label, value }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-white/5
                        flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
        <span className="ml-auto text-sm">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full">
        <div
          className="h-full bg-indigo-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
