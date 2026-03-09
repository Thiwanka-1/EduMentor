import { useState, useEffect } from "react";
import { Upload, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

import { StatCard } from "../../components/ace/StatCard";
import { ActionCard } from "../../components/ace/ActionCard";
import { WeakPoint } from "../../components/ace/WeakPoint";
import { getDashboardSummary } from "../../services/aceApi";

export default function AceDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dashData, setDashData] = useState({
    masteryScore: 0,
    questionsToday: 0,
    filesProcessed: 0,
    recentFiles: [],
    weakTopics: [],
    streak: 0,
  });

  // ✅ get logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser({
          ...res.data,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            res.data.name || "User",
          )}&backgroundColor=c0aede`,
        });
      } catch (err) {
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  // ✅ get dashboard data
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

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Welcome back, <span className="text-indigo-600">{firstName}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            You're on a {dashData.streak}-day streak. Keep the momentum going.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
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
          sub="Synced"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Files */}
        <div className="lg:col-span-2 rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
          <p className="font-semibold text-slate-900 mb-3">Recent Files</p>

          {loading ? (
            <p className="text-sm text-slate-500">Loading recent files…</p>
          ) : dashData.recentFiles.length === 0 ? (
            <p className="text-sm text-slate-500">
              Your uploaded materials will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {dashData.recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex justify-between items-center px-4 py-3 rounded-xl
                             bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg bg-indigo-50
                                 flex items-center justify-center text-indigo-600 text-xs font-bold"
                    >
                      📄
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[280px]">
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

        {/* Weak Points */}
        <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm">
          <p className="font-semibold text-slate-900 mb-3">Weak Points</p>

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : dashData.weakTopics.length === 0 ? (
            <p className="text-sm text-slate-500">
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
    </div>
  );
}
