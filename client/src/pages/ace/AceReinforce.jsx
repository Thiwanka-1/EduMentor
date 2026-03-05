import { useState, useEffect, useCallback } from "react";
import { Play, Flame, CheckCircle, XCircle, Loader2, Trophy, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getWeakTopics,
  generateReinforcementQuiz,
  submitReinforcementAnswers,
} from "../../services/aceApi";

// ── View states ──────────────────────────────────────────────
const VIEW = {
  LOADING: "loading",
  LIST: "list",          // show weak topics list
  GENERATING: "generating", // generating quiz
  QUIZ: "quiz",          // answering questions
  SUBMITTING: "submitting",
  RESULT: "result",      // round result
};

export default function AceReinforce() {
  const navigate = useNavigate();

  const [view, setView] = useState(VIEW.LOADING);
  const [weakTopics, setWeakTopics] = useState([]);
  const [error, setError] = useState(null);

  // Quiz state
  const [activeTopic, setActiveTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizDifficulty, setQuizDifficulty] = useState("easy");
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});

  // Result state
  const [roundResult, setRoundResult] = useState(null);

  // ── Fetch weak topics ──────────────────────────────────────
  const fetchTopics = useCallback(async () => {
    setView(VIEW.LOADING);
    setError(null);
    try {
      const res = await getWeakTopics();
      setWeakTopics(res.weakTopics || []);
      setView(VIEW.LIST);
    } catch (err) {
      setError(err.message);
      setView(VIEW.LIST);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // ── Start quiz for a topic ─────────────────────────────────
  const handleStart = async (topic) => {
    setActiveTopic(topic);
    setView(VIEW.GENERATING);
    setError(null);
    setUserAnswers({});
    setCurrentQ(0);
    setRoundResult(null);

    try {
      const res = await generateReinforcementQuiz({ topic });

      if (res.completed) {
        // Topic already mastered
        await fetchTopics();
        return;
      }

      setQuestions(res.questions || []);
      setQuizDifficulty(res.difficulty || "easy");
      setView(VIEW.QUIZ);
    } catch (err) {
      setError(err.message);
      setView(VIEW.LIST);
    }
  };

  // ── Select an answer ───────────────────────────────────────
  const selectAnswer = (questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // ── Submit answers ─────────────────────────────────────────
  const handleSubmit = async () => {
    setView(VIEW.SUBMITTING);
    setError(null);

    const answers = questions.map((q) => ({
      questionId: q.id,
      userAnswer: userAnswers[q.id] || "",
      correctAnswer: q.answer,
    }));

    try {
      const res = await submitReinforcementAnswers({
        topic: activeTopic,
        answers,
      });
      setRoundResult(res);
      setView(VIEW.RESULT);
    } catch (err) {
      setError(err.message);
      setView(VIEW.QUIZ);
    }
  };

  // ── Back to list ─────────────────────────────────────────
  const backToList = () => {
    setActiveTopic(null);
    setQuestions([]);
    setRoundResult(null);
    fetchTopics();
  };

  // ── Difficulty badge colour ────────────────────────────────
  const diffBadge = (d) => {
    if (d === "hard") return "bg-red-600/15 text-red-400";
    if (d === "medium") return "bg-amber-600/15 text-amber-400";
    return "bg-green-600/15 text-green-400";
  };

  // ── Mastery bar colour ────────────────────────────────────
  const masteryColor = (s) => {
    if (s > 85) return "bg-green-500";
    if (s > 60) return "bg-amber-500";
    return "bg-red-500";
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  // ── LOADING / GENERATING ──────────────────────────────────
  if (view === VIEW.LOADING || view === VIEW.GENERATING) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-indigo-400" size={36} />
        <span className="ml-3 text-slate-500 dark:text-slate-400">
          {view === VIEW.GENERATING
            ? `Generating quiz for "${activeTopic}"…`
            : "Loading weak topics…"}
        </span>
      </div>
    );
  }

  // ── QUIZ VIEW ─────────────────────────────────────────────
  if (view === VIEW.QUIZ || view === VIEW.SUBMITTING) {
    const q = questions[currentQ];
    const totalQ = questions.length;
    const answered = Object.keys(userAnswers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reinforce • {activeTopic}
            </p>
            <h1 className="text-2xl font-semibold mt-1">
              <span className="text-indigo-400">{activeTopic}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${diffBadge(quizDifficulty)}`}>
              {quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}
            </span>
            <button
              onClick={backToList}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Exit Session
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>SESSION PROGRESS</span>
            <span>
              {currentQ + 1} / {totalQ} Questions
            </span>
          </div>
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        {q && (
          <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#070b18] p-10">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/15 text-indigo-400">
              Q{currentQ + 1}
            </span>

            <h2 className="text-2xl font-semibold mt-6 leading-snug">
              {q.question}
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {(q.options || []).map((opt, i) => {
                const letter = String.fromCharCode(65 + i); // A B C D
                const isSelected = userAnswers[q.id] === letter;

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(q.id, letter)}
                    disabled={view === VIEW.SUBMITTING}
                    className={`text-left w-full px-5 py-4 rounded-xl border transition
                      ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-600/10 text-indigo-300"
                          : "border-black/5 dark:border-white/10 bg-white dark:bg-[#0c1222] hover:border-indigo-500/50"
                      }`}
                  >
                    <span className="font-semibold mr-3">{letter}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 rounded-lg text-sm border border-black/10 dark:border-white/10
                           disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Previous
              </button>

              {currentQ < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQ((p) => p + 1)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold
                             bg-gradient-to-r from-indigo-500 to-cyan-500
                             hover:opacity-90 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={answered < totalQ || view === VIEW.SUBMITTING}
                  className="px-5 py-2 rounded-lg text-sm font-semibold
                             bg-gradient-to-r from-indigo-500 to-cyan-500
                             disabled:opacity-40 hover:opacity-90 transition flex items-center gap-2"
                >
                  {view === VIEW.SUBMITTING && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  Submit Answers
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    );
  }

  // ── RESULT VIEW ───────────────────────────────────────────
  if (view === VIEW.RESULT && roundResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center py-6">
          {roundResult.completed ? (
            <Trophy className="mx-auto text-amber-400 mb-4" size={48} />
          ) : null}

          <h1 className="text-3xl font-bold">
            {roundResult.completed
              ? "🎉 Topic Mastered!"
              : "Round Complete"}
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {activeTopic}
          </p>
        </div>

        {/* Score card */}
        <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#070b18] p-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                Round Score
              </p>
              <p className="text-3xl font-bold mt-1">
                {roundResult.roundScore}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                Mastery
              </p>
              <p className="text-3xl font-bold mt-1 text-indigo-400">
                {roundResult.masteryScore}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                Correct
              </p>
              <p className="text-3xl font-bold mt-1">
                {roundResult.correctCount}/{roundResult.totalQuestions}
              </p>
            </div>
          </div>

          {/* Mastery bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Overall Mastery</span>
              <span>{roundResult.masteryScore}%</span>
            </div>
            <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${masteryColor(roundResult.masteryScore)}`}
                style={{ width: `${roundResult.masteryScore}%` }}
              />
            </div>
          </div>

          {/* Next difficulty */}
          <div className="mt-4 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${diffBadge(roundResult.difficulty)}`}>
              Next round: {roundResult.difficulty}
            </span>
          </div>
        </div>

        {/* Per-question results */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Answer Breakdown
          </h3>
          {(roundResult.results || []).map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl p-4 border
                ${
                  r.isCorrect
                    ? "border-green-500/30 bg-green-600/5"
                    : "border-red-500/30 bg-red-600/5"
                }`}
            >
              {r.isCorrect ? (
                <CheckCircle className="text-green-400 mt-0.5 shrink-0" size={18} />
              ) : (
                <XCircle className="text-red-400 mt-0.5 shrink-0" size={18} />
              )}
              <div className="text-sm">
                <p>
                  <span className="font-medium">Q{r.questionId}:</span>{" "}
                  Your answer: <strong>{r.userAnswer || "—"}</strong>
                  {!r.isCorrect && (
                    <span className="text-green-400 ml-2">
                      Correct: {r.correctAnswer}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={backToList}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-black/10 dark:border-white/10
                       hover:bg-black/5 dark:hover:bg-white/5 transition text-sm"
          >
            <ArrowLeft size={16} /> Back to Topics
          </button>

          {!roundResult.completed && (
            <button
              onClick={() => handleStart(activeTopic)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm
                         bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 transition"
            >
              <RefreshCw size={16} /> Continue Practicing
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── TOPIC LIST VIEW (default) ─────────────────────────────
  return (
    <div className="flex gap-8">
      {/* MAIN CONTENT */}
      <main className="flex-1 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adaptive Concept Reinforcement
            </p>
            <h1 className="text-2xl font-semibold mt-1">
              Your{" "}
              <span className="text-indigo-400">Weak Topics</span>
            </h1>
          </div>

          <button
            onClick={() => navigate("/ace")}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            ← Dashboard
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Empty state */}
        {weakTopics.length === 0 && !error && (
          <div className="text-center py-20">
            <Trophy className="mx-auto text-amber-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold">All Clear! 🎉</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              You have no weak topics. Keep up the great work!
            </p>
          </div>
        )}

        {/* Weak topic cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weakTopics.map((t) => (
            <div
              key={t.topic}
              className="rounded-2xl border border-black/5 dark:border-white/10
                         bg-white dark:bg-[#070b18] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-medium">{t.topic}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diffBadge(t.difficulty)}`}>
                    {t.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mastery {t.masteryScore}% • {t.attempts} attempt{t.attempts !== 1 ? "s" : ""}
                </p>

                <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${masteryColor(t.masteryScore)}`}
                    style={{ width: `${t.masteryScore}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleStart(t.topic)}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                           text-sm font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500
                           hover:opacity-90 transition"
              >
                <Play size={14} />
                {t.attempts === 0 ? "Start" : "Continue"}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 space-y-6 hidden xl:block">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Flame className="text-red-400" size={16} />
            Weak Lessons
          </h3>

          {weakTopics.map((t) => (
            <div
              key={t.topic}
              className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#070b18] p-4 mb-4"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">{t.topic}</p>
                <button
                  onClick={() => handleStart(t.topic)}
                  className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  <Play size={14} />
                  Start
                </button>
              </div>

              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Progress</span>
                <span>{t.masteryScore}%</span>
              </div>

              <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full">
                <div
                  className={`h-full rounded-full ${masteryColor(t.masteryScore)}`}
                  style={{ width: `${t.masteryScore}%` }}
                />
              </div>
            </div>
          ))}

          {weakTopics.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No weak topics remaining.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
