import { useState, useEffect } from "react";
import {
  Flame,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProgressAnalysis } from "../../services/aceApi";

export default function AceAnalysis() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    masteryScore: 0,
    totalQuestions: 0,
    streak: 0,
    performanceTrend: [],
    improvement: 0,
    criticalWeakPoints: [],
    topicMastery: [],
    recommendation: { topics: [], recommendedQuestions: 20, description: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalysis() {
      try {
        setLoading(true);
        const res = await getProgressAnalysis();
        if (!cancelled) {
          setData({
            masteryScore: res.masteryScore ?? 0,
            totalQuestions: res.totalQuestions ?? 0,
            streak: res.streak ?? 0,
            performanceTrend: res.performanceTrend ?? [],
            improvement: res.improvement ?? 0,
            criticalWeakPoints: res.criticalWeakPoints ?? [],
            topicMastery: res.topicMastery ?? [],
            recommendation: res.recommendation ?? {
              topics: [],
              recommendedQuestions: 20,
              description: "",
            },
          });
        }
      } catch (err) {
        console.error("Failed to load analysis:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalysis();
    return () => { cancelled = true; };
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Progress Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Loading your learning data…
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/70 dark:border-white/10
                         bg-white dark:bg-[#070b18] p-6 animate-pulse"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded mb-4" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
))}
        </div>
      </div>
      );
  }

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
                    : "bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
          value={`${data.masteryScore}%`}
          sub={data.improvement >= 0 ? `+${data.improvement}%` : `${data.improvement}%`}
          icon={<TrendingUp />}
        />
        <StatCard
          title="QUESTIONS"
          value={data.totalQuestions.toLocaleString()}
          sub={data.totalQuestions > 0 ? "answered" : "—"}
          icon={<HelpCircle />}
        />
        <StatCard
          title="STREAK"
          value={`${data.streak} Days`}
          sub={data.streak > 0 ? "Active" : "Inactive"}
          icon={<Flame />}
        />
      </div>

      {/* ================= MIDDLE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold">Performance Over Time</h3>
              <p className="text-xs text-slate-500">
                Accuracy trend over the last 4 weeks
              </p>
            </div>

            <span className="text-xs px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-400">
              {data.improvement >= 0 ? `+${data.improvement}%` : `${data.improvement}%`} Improvement
            </span>
          </div>

          {/* Chart visualization */}
          <div className="h-56 rounded-xl bg-gradient-to-t
                          from-indigo-600/10 to-transparent
                          relative overflow-hidden">
            {data.performanceTrend.length > 0 ? (
              <div className="absolute inset-0 flex items-end px-6 pb-10 gap-2">
                {data.performanceTrend.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-indigo-400 font-medium">
                      {week.accuracy}%
                    </span>
                    <div
                      className="w-full bg-indigo-500/60 rounded-t-lg transition-all duration-700
                                 hover:bg-indigo-500 cursor-default"
                      style={{ height: `${Math.max(week.accuracy * 1.8, 8)}px` }}
                      title={`${week.label}: ${week.accuracy}% accuracy (${week.totalCorrect}/${week.totalQuestions})`}
                    />
                  </div>
))}
              </div>
) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-slate-500">
                  No performance data yet — complete some quizzes to see trends.
                </p>
              </div>
)}

            <div className="absolute bottom-4 left-6 right-6
                            flex justify-between text-xs text-slate-500">
              {data.performanceTrend.length > 0
                ? data.performanceTrend.map((w) => (
                    <span key={w.label}>{w.label}</span>
                    ))
                : ["Week 1", "Week 2", "Week 3", "Week 4"].map((w) => (
                    <span key={w}>{w}</span>
))}
            </div>
          </div>
        </div>

        {/* Critical Weak Points */}
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-400" size={18} />
            <h3 className="font-semibold">Critical Weak Points</h3>
          </div>

          {data.criticalWeakPoints.length === 0 ? (
            <p className="text-sm text-slate-500">
              No critical weak points — keep it up! 
            </p>
) : (
            data.criticalWeakPoints.map((wp) => (
              <Weak
                key={wp.topic}
                label={wp.topic}
                value={wp.masteryScore}
              />
              ))
)}

          <button
            onClick={() => navigate("/ace/reinforce")}
            className="w-full mt-5 py-2 rounded-xl
                       bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10
                       text-sm font-semibold"
          >
            View All Topics
          </button>
        </div>
      </div>

      {/* ================= BOTTOM ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
          <span className="text-xs px-2 py-1 rounded-full
                           bg-indigo-600/15 text-indigo-400">
            Recommended Action
          </span>

          <h3 className="mt-3 text-xl font-semibold">
            {data.recommendation.topics.length > 0
              ? "Weak Points Refresher"
              : "Great Progress!"}
          </h3>

          <p className="text-slate-500 mt-2 max-w-xl">
            {data.recommendation.topics.length > 0 ? (
              <>
                We've generated a targeted session with{" "}
                {data.recommendation.recommendedQuestions} questions focusing on
                {data.recommendation.topics.map((topic, i) => (
                  <span key={topic}>
                    {i > 0 && " and"}
                    <span className="text-slate-900 dark:text-white font-medium">
                      {" "}{topic}
                    </span>
                  </span>
))}.
              </>
) : (
              "No critical weak points detected. Keep studying to maintain your mastery!"
)}
          </p>

          {data.recommendation.topics.length > 0 && (
            <div className="mt-5 flex gap-4">
              <button
                onClick={() => navigate("/ace/reinforce")}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
              >
                 Start Session
              </button>
              <button className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Customize
              </button>
            </div>
)}
        </div>

        {/* Topic Mastery */}
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Topic Mastery</h3>
            <button
              onClick={() => navigate("/ace/reinforce")}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Details
            </button>
          </div>

          {data.topicMastery.length === 0 ? (
            <p className="text-sm text-slate-500">
              No topics tracked yet — complete reinforcement quizzes to see progress.
            </p>
) : (
            data.topicMastery.slice(0, 5).map((tp) => (
              <Topic
                key={tp.topic}
                icon={<BookOpen size={16} />}
                label={tp.topic}
                value={tp.masteryScore}
              />
              ))
)}
        </div>
      </div>
    </div>
    );
}

/* ================= COMPONENTS ================= */

function StatCard({ title, value, sub, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
      <div className="flex justify-between items-start">
        <p className="text-xs text-slate-500">{title}</p>
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
      <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full">
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
        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5
                        flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <span className="text-sm">{label}</span>
        <span className="ml-auto text-sm">{value}%</span>
      </div>
      <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full">
        <div
          className="h-full bg-indigo-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
    );
}
