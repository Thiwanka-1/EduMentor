import { Play, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AceReinforce() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-8">
      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 space-y-8">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">
              Reinforce • Thermodynamics Entropy
            </p>
            <h1 className="text-2xl font-semibold mt-1">
              Define the Second Law of{" "}
              <span className="text-indigo-400">
                Thermodynamics
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-indigo-600/15 text-indigo-400 text-sm">
              Mastery Score: 78%
            </div>

            <button
              onClick={() => navigate("/ace")}
              className="text-sm text-slate-400 hover:text-white"
            >
              Exit Session
            </button>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>SESSION PROGRESS</span>
            <span>12 / 25 Cards</span>
          </div>

          <div className="h-1.5 bg-white/10 rounded-full">
            <div className="h-full w-[48%] bg-gradient-to-r from-indigo-500 to-cyan-500" />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-3xl border border-white/10 bg-[#070b18] p-10">
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/15 text-indigo-400">
            CONCEPT
          </span>

          <h2 className="text-3xl font-semibold mt-6 leading-snug">
            Define the Second Law of Thermodynamics in
            relation to entropy.
          </h2>

          <p className="text-slate-400 mt-4">
            Consider isolated systems and the direction of
            heat transfer.
          </p>

          <button
            className="mt-10 px-6 py-3 rounded-xl font-semibold
                       bg-gradient-to-r from-indigo-500 to-cyan-500
                       hover:opacity-90 transition"
          >
            Reveal Answer
          </button>
        </div>

        {/* Weak Points */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame className="text-red-400" size={18} />
            Your Weak Points
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {[
              { topic: "Entropy Increase", value: 42 },
              { topic: "Heat Flow Direction", value: 38 },
              { topic: "Isolated Systems", value: 47 },
            ].map((w) => (
              <div
                key={w.topic}
                className="rounded-2xl border border-white/10 bg-[#070b18] p-4"
              >
                <p className="text-sm font-medium">{w.topic}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Mastery {w.value}%
                </p>

                <div className="mt-2 h-1.5 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${w.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ================= RIGHT SIDEBAR ================= */}
      <aside className="w-80 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Weak Lessons
          </h3>

          {[
            {
              title: "Second Law Basics",
              progress: 60,
            },
            {
              title: "Entropy in Isolated Systems",
              progress: 35,
            },
            {
              title: "Heat Transfer Direction",
              progress: 45,
            },
          ].map((lesson) => (
            <div
              key={lesson.title}
              className="rounded-2xl border border-white/10 bg-[#070b18] p-4 mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">
                  {lesson.title}
                </p>

                <button
                  onClick={() => navigate("/ace/session")}
                  className="flex items-center gap-1 text-sm
                             text-indigo-400 hover:text-indigo-300"
                >
                  <Play size={14} />
                  Start
                </button>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Progress</span>
                <span>{lesson.progress}%</span>
              </div>

              <div className="h-1.5 bg-white/10 rounded-full">
                <div
                  className="h-full bg-indigo-500"
                  style={{
                    width: `${lesson.progress}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
