import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Flame,
  CheckCircle,
  XCircle,
  Loader2,
  Trophy,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getWeakTopics,
  generateReinforcementQuiz,
  submitReinforcementAnswers,
} from "../../services/aceApi";

const VIEW = {
  LOADING: "loading",
  LIST: "list",
  GENERATING: "generating",
  QUIZ: "quiz",
  SUBMITTING: "submitting",
  RESULT: "result",
};

export default function AceReinforce() {
  const navigate = useNavigate();

  const [view, setView] = useState(VIEW.LOADING);
  const [weakTopics, setWeakTopics] = useState([]);
  const [error, setError] = useState(null);

  const [activeTopic, setActiveTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizDifficulty, setQuizDifficulty] = useState("easy");
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});

  const [roundResult, setRoundResult] = useState(null);

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

  const selectAnswer = (questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

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

  const backToList = () => {
    setActiveTopic(null);
    setQuestions([]);
    setRoundResult(null);
    fetchTopics();
  };

  const diffBadge = (d) => {
    if (d === "hard") return "bg-rose-50 text-rose-600 border border-rose-200";
    if (d === "medium")
      return "bg-amber-50 text-amber-600 border border-amber-200";
    return "bg-emerald-50 text-emerald-600 border border-emerald-200";
  };

  const masteryColor = (s) => {
    if (s > 85) return "bg-emerald-500";
    if (s > 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  if (view === VIEW.LOADING || view === VIEW.GENERATING) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
        <span className="ml-3 text-slate-500">
          {view === VIEW.GENERATING
            ? `Generating quiz for "${activeTopic}"…`
            : "Loading weak topics..."}
        </span>
      </div>
    );
  }

  if (view === VIEW.QUIZ || view === VIEW.SUBMITTING) {
    const q = questions[currentQ];
    const totalQ = questions.length;
    const answered = Object.keys(userAnswers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500">Reinforce • {activeTopic}</p>
            <h1 className="text-2xl font-semibold mt-1 text-slate-900">
              <span className="text-indigo-600">{activeTopic}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm ${diffBadge(quizDifficulty)}`}
            >
              {quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1)}
            </span>
            <button
              onClick={backToList}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Exit Session
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>SESSION PROGRESS</span>
            <span>
              {currentQ + 1} / {totalQ} Questions
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
            />
          </div>
        </div>

        {q && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              Q{currentQ + 1}
            </span>

            <h2 className="text-2xl font-semibold mt-6 leading-snug text-slate-900">
              {q.question}
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-3">
              {(q.options || []).map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = userAnswers[q.id] === letter;

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(q.id, letter)}
                    disabled={view === VIEW.SUBMITTING}
                    className={`text-left w-full px-5 py-4 rounded-xl border transition ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <span className="font-semibold mr-3">{letter}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 rounded-lg text-sm border border-slate-200
                           disabled:opacity-30 hover:bg-slate-50 transition"
              >
                Previous
              </button>

              {currentQ < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQ((p) => p + 1)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white
                             bg-gradient-to-r from-indigo-500 to-cyan-500
                             hover:opacity-90 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={answered < totalQ || view === VIEW.SUBMITTING}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white
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

        {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
      </div>
    );
  }

  if (view === VIEW.RESULT && roundResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center py-6">
          {roundResult.completed ? (
            <Trophy className="mx-auto text-amber-500 mb-4" size={48} />
          ) : null}

          <h1 className="text-3xl font-bold text-slate-900">
            {roundResult.completed ? "Topic Mastered!" : "Round Complete"}
          </h1>

          <p className="text-slate-500 mt-2">{activeTopic}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-slate-500 uppercase">Round Score</p>
              <p className="text-3xl font-bold mt-1 text-slate-900">
                {roundResult.roundScore}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Mastery</p>
              <p className="text-3xl font-bold mt-1 text-indigo-600">
                {roundResult.masteryScore}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Correct</p>
              <p className="text-3xl font-bold mt-1 text-slate-900">
                {roundResult.correctCount}/{roundResult.totalQuestions}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Overall Mastery</span>
              <span>{roundResult.masteryScore}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-500 ${masteryColor(
                  roundResult.masteryScore,
                )}`}
                style={{ width: `${roundResult.masteryScore}%` }}
              />
            </div>
          </div>

          <div className="mt-4 text-center">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm ${diffBadge(roundResult.difficulty)}`}
            >
              Next round: {roundResult.difficulty}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase">
            Answer Breakdown
          </h3>
          {(roundResult.results || []).map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl p-4 border ${
                r.isCorrect
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              {r.isCorrect ? (
                <CheckCircle
                  className="text-emerald-500 mt-0.5 shrink-0"
                  size={18}
                />
              ) : (
                <XCircle className="text-rose-500 mt-0.5 shrink-0" size={18} />
              )}
              <div className="text-sm text-slate-700">
                <p>
                  <span className="font-medium">Q{r.questionId}:</span> Your
                  answer: <strong>{r.userAnswer || "—"}</strong>
                  {!r.isCorrect && (
                    <span className="text-emerald-600 ml-2">
                      Correct: {r.correctAnswer}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={backToList}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200
                       hover:bg-slate-50 transition text-sm text-slate-700"
          >
            <ArrowLeft size={16} /> Back to Topics
          </button>

          {!roundResult.completed && (
            <button
              onClick={() => handleStart(activeTopic)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white
                         bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 transition"
            >
              <RefreshCw size={16} /> Continue Practicing
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <main className="flex-1 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500">
              Adaptive Concept Reinforcement
            </p>
            <h1 className="text-2xl font-semibold mt-1 text-slate-900">
              Your <span className="text-indigo-600">Weak Topics</span>
            </h1>
          </div>

          <button
            onClick={() => navigate("/ace")}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Dashboard
          </button>
        </div>

        {error && <p className="text-rose-500 text-sm">{error}</p>}

        {weakTopics.length === 0 && !error && (
          <div className="text-center py-20">
            <Trophy className="mx-auto text-amber-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-slate-900">All Clear!</h2>
            <p className="text-slate-500 mt-2">
              You have no weak topics. Keep up the great work!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {weakTopics.map((t) => (
            <div
              key={t.topic}
              className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-medium text-slate-900">
                    {t.topic}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${diffBadge(t.difficulty)}`}
                  >
                    {t.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Mastery {t.masteryScore}% • {t.attempts} attempt
                  {t.attempts !== 1 ? "s" : ""}
                </p>

                <div className="mt-2 h-1.5 bg-slate-200 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${masteryColor(
                      t.masteryScore,
                    )}`}
                    style={{ width: `${t.masteryScore}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleStart(t.topic)}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                           text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-cyan-500
                           hover:opacity-90 transition"
              >
                <Play size={14} />
                {t.attempts === 0 ? "Start" : "Continue"}
              </button>
            </div>
          ))}
        </div>
      </main>

      <aside className="w-80 space-y-6 hidden xl:block">
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900">
            <Flame className="text-rose-500" size={16} />
            Weak Lessons
          </h3>

          {weakTopics.map((t) => (
            <div
              key={t.topic}
              className="rounded-2xl border border-slate-200 bg-white p-4 mb-4 shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-slate-900">{t.topic}</p>
                <button
                  onClick={() => handleStart(t.topic)}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  <Play size={14} />
                  Start
                </button>
              </div>

              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{t.masteryScore}%</span>
              </div>

              <div className="h-1.5 bg-slate-200 rounded-full">
                <div
                  className={`h-full rounded-full ${masteryColor(t.masteryScore)}`}
                  style={{ width: `${t.masteryScore}%` }}
                />
              </div>
            </div>
          ))}

          {weakTopics.length === 0 && (
            <p className="text-xs text-slate-500">No weak topics remaining.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
