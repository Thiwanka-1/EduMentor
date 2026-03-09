import { useState, useEffect } from "react";
import { Upload, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useTheme from "../../hooks/useTheme";
import useAuth from "../../hooks/useAuth";

import AceSidebar from "../../components/ace/AceSidebar";
import { StatCard } from "../../components/ace/StatCard";
import { ActionCard } from "../../components/ace/ActionCard";
import { WeakPoint } from "../../components/ace/WeakPoint";
import { getDashboardSummary } from "../../services/aceApi";

export default function AceDashboard() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState({
    masteryScore: 0,
    questionsToday: 0,
    filesProcessed: 0,
    recentFiles: [],
    weakTopics: [],
    streak: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await getDashboardSummary();
        if (!cancelled) {
          setDashData({
            masteryScore: data.masteryScore ?? 0,
            questionsToday: data.questionsToday ?? 0,
            filesProcessed: data.filesProcessed ?? 0,
            recentFiles: data.recentFiles ?? [],
            weakTopics: data.weakTopics ?? [],
            streak: data.streak ?? 0,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  // Get first name
  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back,{" "}
            <span className="text-indigo-500">{firstName}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
             You're on a {dashData.streak}-day streak. Keep the momentum going.
          </p>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10
                     bg-white dark:bg-slate-900 text-sm font-semibold"
        >
          {theme === "dark" ? " Light" : " Dark"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        <StatCard
          title="TOTAL MASTERY"
          value={`${dashData.masteryScore}%`}
          sub={dashData.masteryScore > 0 ? `${dashData.masteryScore}%` : "—"}
          percent={dashData.masteryScore}
          loading={loading}
        />
        <StatCard
          title="QUESTIONS TODAY"
          value={String(dashData.questionsToday)}
          sub="/ 50 goal"
          loading={loading}
        />
        <StatCard
          title="FILES PROCESSED"
          value={String(dashData.filesProcessed)}
          sub=" Synced"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
           Quick Actions
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
          className="col-span-2 rounded-2xl p-5 border border-slate-200/70
                     dark:border-white/5 bg-white dark:bg-[#070b18]"
        >
          <p className="font-semibold mb-3">Recent Files</p>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading recent files…
            </p>
) : dashData.recentFiles.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your uploaded materials will appear here.
            </p>
) : (
            <div className="space-y-3">
              {dashData.recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex justify-between items-center px-4 py-3
                             rounded-xl bg-slate-50 dark:bg-white/5
                             border border-slate-200/70 dark:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20
                                    flex items-center justify-center text-indigo-400 text-xs">
                      
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[280px]">
                        {file.filename}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
))}
            </div>
)}
        </div>

        {/* Weak points */}
        <div>
          <p className="font-semibold mb-3">Weak Points</p>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading…
            </p>
) : dashData.weakTopics.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No weak points detected — great job!
            </p>
) : (
            <div className="space-y-4">
              {dashData.weakTopics.map((wt) => (
                <WeakPoint
                  key={wt.topic}
                  label={wt.topic}
                  value={wt.masteryScore}
                />
))}
            </div>
)}
        </div>
      </div>
    </>
    );
}
