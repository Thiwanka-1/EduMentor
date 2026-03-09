import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  ChevronRight,
  Trophy,
  BookOpen,
  RotateCw,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import {
  getQuizzes,
  getQuizById,
  getResults,
  regenerateQuiz,
} from "../../services/aceApi";

export default function ReviewQuiz() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizDetail, setQuizDetail] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Fetch all quizzes on mount
  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    setLoading(true);
    setError(null);
    try {
      const res = await getQuizzes();
      setQuizzes(res.quizzes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function viewQuizDetail(quizId) {
    setLoadingDetail(true);
    setSelectedQuiz(quizId);
    try {
      const [quizRes, attemptsRes] = await Promise.all([
        getQuizById(quizId),
        getResults(quizId),
      ]);
      setQuizDetail(quizRes.quiz);
      setAttempts(attemptsRes.results || []);
    } catch (err) {
      console.error("Failed to load quiz detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleRetryQuiz(quiz) {
    navigate("/ace/session", {
      state: {
        quizId: quiz.id,
        questions: quiz.questions,
        config: quiz.config,
        materialId: quiz.materialId?._id || quiz.materialId,
      },
    });
  }

  async function handleRegenerate(materialId) {
    if (!materialId) return;
    setRegenerating(true);
    try {
      const res = await regenerateQuiz({ materialId });
      navigate("/ace/session", {
        state: {
          quizId: res.quizId,
          questions: res.questions,
          config: res.config,
          materialId,
        },
      });
    } catch (err) {
      console.error("Regenerate failed:", err);
    } finally {
      setRegenerating(false);
    }
  }

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      !searchTerm ||
      (q.material?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.config?.questionType || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" || q.config?.questionType === filterType;

    return matchesSearch && matchesFilter;
  });

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getScoreColor(score) {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  }

  if (selectedQuiz && quizDetail) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => {
            setSelectedQuiz(null);
            setQuizDetail(null);
            setAttempts([]);
          }}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white
                     flex items-center gap-1 transition"
        >
          ← Back to Quiz History
        </button>

        {/* Quiz info header */}
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-8">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/15 text-indigo-400 uppercase">
                {quizDetail.config?.questionType?.replace("_", " ") || "Quiz"}
              </span>
              <h1 className="text-2xl font-semibold mt-3">
                {quizDetail.materialId?.title || "Quiz Review"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {quizDetail.questions?.length || 0} questions •{" "}
                {quizDetail.config?.difficulty || "medium"} difficulty •{" "}
                {formatDate(quizDetail.createdAt)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleRetryQuiz(quizDetail)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm
                           flex items-center gap-2 hover:bg-indigo-700 transition"
              >
                <RotateCw className="w-4 h-4" /> Retry Quiz
              </button>
              <button
                onClick={() =>
                  handleRegenerate(
                    quizDetail.materialId?._id || quizDetail.materialId
                    )
                }
                disabled={regenerating}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-semibold text-sm
                           flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition
                           disabled:opacity-50"
              >
                {regenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
) : (
                  <BookOpen className="w-4 h-4" />
)}
                New Quiz from Same Material
              </button>
            </div>
          </div>
        </div>

        {/* Attempt history */}
        {attempts.length > 0 && (
          <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Your Attempts ({attempts.length})
            </h2>
            <div className="space-y-3">
              {attempts.map((attempt, i) => (
                <div
                  key={attempt.id || i}
                  className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]
                             border border-slate-200/70 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        attempt.score
)}`}
                    >
                      {attempt.score}%
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {attempt.correctCount}/{attempt.totalQuestions} correct
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(attempt.submittedAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${
                      attempt.grade === "A"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : attempt.grade === "B"
                        ? "bg-blue-500/15 text-blue-400"
                        : attempt.grade === "C"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    Grade {attempt.grade}
                  </span>
                </div>
))}
            </div>
          </div>
)}

        {/* Questions with explanations */}
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
          <h2 className="font-semibold text-lg mb-4">
            Questions & Explanations
          </h2>
          <div className="space-y-4">
            {quizDetail.questions?.map((q, i) => (
              <div
                key={q.id || i}
                className="p-4 rounded-xl border border-slate-200/70 dark:border-white/5
                           bg-black/[0.01] dark:bg-white/[0.02]"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-600/15 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{q.question}</p>

                    {/* Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, oi) => {
                          const letter = String.fromCharCode(65 + oi);
                          const isCorrect =
                            q.correct_answer?.charAt(0).toUpperCase() ===
                              letter ||
                            q.correct_answer?.toLowerCase() ===
                              opt.toLowerCase();
                          return (
                            <div
                              key={oi}
                              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2
                                ${
                                  isCorrect
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}
                            >
                              <span className="font-semibold">{letter}.</span>
                              {opt.replace(/^[A-D]\)\s*/, "")}
                              {isCorrect && (
                                <CheckCircle className="w-3 h-3 ml-auto" />
)}
                            </div>
                            );
                        })}
                      </div>
)}

                    {/* Correct answer */}
                    <p className="text-xs text-emerald-400 mt-2">
                       Correct:{" "}
                      <span className="font-medium">{q.correct_answer}</span>
                    </p>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="mt-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-indigo-400">
                            Explanation:{" "}
                          </span>
                          {q.explanation}
                        </p>
                      </div>
)}
                  </div>
                </div>
              </div>
))}
          </div>
        </div>
      </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Quiz History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review past quizzes, see explanations, and retry for better scores.
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                       bg-white dark:bg-[#070b18] text-sm outline-none focus:border-indigo-500/50
                       placeholder:text-slate-400"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                     bg-white dark:bg-[#070b18] text-sm outline-none cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True / False</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-slate-500">Loading quizzes...</span>
        </div>
)}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchQuizzes}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Retry
          </button>
        </div>
)}

      {/* Empty state */}
      {!loading && !error && filteredQuizzes.length === 0 && (
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Upload study material and generate your first quiz to get started.
          </p>
          <button
            onClick={() => navigate("/ace/create")}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm
                       hover:bg-indigo-700 transition"
          >
            Create Your First Quiz
          </button>
        </div>
)}

      {/* Quiz list */}
      {!loading && filteredQuizzes.length > 0 && (
        <div className="space-y-3">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => viewQuizDetail(quiz.id)}
              className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18]
                         p-5 cursor-pointer hover:border-indigo-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500
                                  flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">
                      {quiz.material?.title || "Untitled Quiz"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-400">
                        {quiz.config?.questionType?.replace("_", " ") || "quiz"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {quiz.questionCount || 0} questions
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {quiz.config?.difficulty || "medium"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(quiz.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600
                                           group-hover:text-indigo-400 transition" />
                </div>
              </div>
            </div>
))}
        </div>
)}

      {/* Loading detail overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-2xl bg-white dark:bg-[#070b18] p-8 flex items-center gap-4 shadow-2xl">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="font-medium">Loading quiz details...</span>
          </div>
        </div>
)}
    </div>
    );
}
