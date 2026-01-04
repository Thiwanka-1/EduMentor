import { Upload, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useTheme from "../../hooks/useTheme";

import AceSidebar from "../../components/ace/AceSidebar";
import { StatCard } from "../../components/ace/StatCard";
import { ActionCard } from "../../components/ace/ActionCard";
import { WeakPoint } from "../../components/ace/WeakPoint";

export default function AceDashboard() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const loading = false; // fake loading flag

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#050812]
                    text-slate-900 dark:text-slate-100">
      {/* Sidebar */}

      {/* Main */}
      <main className="flex-1 px-10 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold">
              Welcome back,{" "}
              <span className="text-indigo-500">Alex</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              🔥 You’re on a 5-day streak. Keep the momentum going.
            </p>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10
                       bg-white dark:bg-slate-900 text-sm font-semibold"
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 mb-10">
          <StatCard
            title="TOTAL MASTERY"
            value="68%"
            sub="+12%"
            percent={68}
            loading={loading}
          />
          <StatCard
            title="QUESTIONS TODAY"
            value="42"
            sub="/ 50 goal"
            loading={loading}
          />
          <StatCard
            title="FILES PROCESSED"
            value="12"
            sub="✓ Synced"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            ⚡ Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <ActionCard
              icon={<Upload />}
              title="Upload & Generate"
              desc="Upload files to generate adaptive quizzes and summaries."
              onClick={() => navigate("/ace/create")}
            />
            <ActionCard
              icon={<Layers />}
              title="Create Flashcard Deck"
              desc="Create or import flashcards to start spaced repetition."
              onClick={() => navigate("/ace/flashcards")}
            />
          </div>
        </section>

        {/* Lower section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Recent files */}
          <div
            className="col-span-2 rounded-2xl p-5 border border-black/5
                       dark:border-white/5 bg-white dark:bg-[#070b18]"
          >
            <p className="font-semibold mb-3">Recent Files</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Demo data only. Backend integration coming next.
            </p>
          </div>

          {/* Weak points */}
          <div>
            <p className="font-semibold mb-3">Weak Points</p>
            <div className="space-y-4">
              <WeakPoint label="Organic Chemistry" value={32} />
              <WeakPoint label="European History" value={48} />
              <WeakPoint label="JavaScript Async" value={55} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
