import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Flag,
  Loader2,
  RotateCw,
  ArrowLeft,
} from "lucide-react";
import { submitAnswers, regenerateQuiz } from "../../services/aceApi";

// Fallback demo questions (used when no backend data is available)
const DEMO_QUESTIONS = [
  {
    id: 1,
    question: "Upload study material and generate a quiz to see real questions here.",
    type: "short_answer",
    correct_answer: "Upload and generate",
    explanation: "Go to the Create page, upload your files, and click Generate Study Set.",
  },
];

export default function AceSession() {
  const location = useLocation();
  const navigate = useNavigate();

  const quizData = location.state || {};
  const questions = quizData.questions?.length > 0 ? quizData.questions : DEMO_QUESTIONS;
  const quizId = quizData.quizId || null;
  const materialId = quizData.materialId || null;

  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState({}); // { id: { correct, userAnswer } }
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(results).length;
  const accuracy = useMemo(() => {
    if (answered === 0) return 0;
    const correct = Object.values(results).filter((r) => r.correct).length;
    return Math.round((correct / answered) * 100);
  }, [results, answered]);

  function checkAnswer() {
    const answer = q.type === "multiple_choice" || q.type === "true_false" ? selectedOption : userAnswer;
    if (!answer) return;

    let isCorrect = false;
    const correctAns = (q.correct_answer || "").toString().trim().toLowerCase();
    const userAns = answer.toString().trim().toLowerCase();

    if (q.type === "multiple_choice") {
      isCorrect = correctAns.charAt(0).toLowerCase() === userAns.charAt(0).toLowerCase() || correctAns === userAns;
    } else if (q.type === "true_false") {
      isCorrect = correctAns === userAns;
    } else {
      isCorrect = userAns === correctAns || correctAns.includes(userAns) || userAns.includes(correctAns);
    }

    setResults((prev) => ({
      ...prev,
      [q.id]: { correct: isCorrect, userAnswer: answer },
    }));
    setChecked(true);
    setShowExplanation(true);
  }

  function nextQuestion() {
    setChecked(false);
    setUserAnswer("");
    setSelectedOption(null);
    setShowExplanation(false);

    if (current < total - 1) {
      setCurrent(current + 1);
    }
  }

  async function handleFinish() {
    if (!quizId) {
      // Demo mode – just show local results
      setFinalResult({
        score: accuracy,
        correctCount: Object.values(results).filter((r) => r.correct).length,
        totalQuestions: total,
        grade: accuracy >= 90 ? "A" : accuracy >= 80 ? "B" : accuracy >= 70 ? "C" : accuracy >= 60 ? "D" : "F",
      });
      return;
    }

    setSubmitting(true);
    try {
      const answers = Object.entries(results).map(([questionId, data]) => ({
        questionId: parseInt(questionId),
        userAnswer: data.userAnswer,
      }));

      const res = await submitAnswers({ quizId, answers });
      setFinalResult(res);
    } catch (err) {
      console.error("Submit failed:", err);
      // Fall back to local scoring
      setFinalResult({
        score: accuracy,
        correctCount: Object.values(results).filter((r) => r.correct).length,
        totalQuestions: total,
        grade: accuracy >= 90 ? "A" : accuracy >= 80 ? "B" : accuracy >= 70 ? "C" : accuracy >= 60 ? "D" : "F",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegenerate() {
    if (!materialId) {
      navigate("/ace/create");
      return;
    }

    setRegenerating(true);
    try {
      const res = await regenerateQuiz({ materialId });
      // Reset state and load new questions
      setCurrent(0);
      setResults({});
      setChecked(false);
      setUserAnswer("");
      setSelectedOption(null);
      setFinalResult(null);
      setShowExplanation(false);

      // Navigate to same page with new data
      navigate("/ace/session", {
        state: {
          quizId: res.quizId,
          questions: res.questions,
          config: res.config,
          materialId,
        },
        replace: true,
      });
    } catch (err) {
      console.error("Regenerate failed:", err);
    } finally {
      setRegenerating(false);
    }
  }

  const allAnswered = answered >= total;

  if (finalResult) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-10 text-center">
          <div className="text-6xl mb-4">
            {finalResult.score >= 80 ? "" : finalResult.score >= 60 ? "" : ""}
          </div>

          <h1 className="text-3xl font-semibold mb-2">Quiz Complete!</h1>

          <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
            <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4">
              <p className="text-3xl font-bold text-indigo-400">{finalResult.score}%</p>
              <p className="text-xs text-slate-500 mt-1">Score</p>
            </div>
            <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4">
              <p className="text-3xl font-bold text-emerald-400">{finalResult.correctCount}</p>
              <p className="text-xs text-slate-500 mt-1">Correct</p>
            </div>
            <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4">
              <p className="text-3xl font-bold text-slate-500">{finalResult.grade}</p>
              <p className="text-xs text-slate-500 mt-1">Grade</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2
                         disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
              New Quiz
            </button>

            <button
              onClick={() => navigate("/ace")}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 font-semibold
                         flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Question Breakdown</h3>
          {questions.map((question) => {
            const r = results[question.id];
            return (
              <div
                key={question.id}
                className={`rounded-xl border p-4 ${
                  r?.correct
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {r?.correct ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
) : (
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{question.question}</p>
                    {r && !r.correct && (
                      <p className="text-xs text-slate-500 mt-1">
                        Correct: <span className="text-emerald-400">{question.correct_answer}</span>
                      </p>
)}
                    {question.explanation && (
                      <p className="text-xs text-slate-500 mt-1 italic">{question.explanation}</p>
)}
                  </div>
                </div>
              </div>
              );
          })}
        </div>
      </div>
      );
  }

  return (
    <div className="flex gap-8">
      {/* ================= LEFT PANEL ================= */}
      <aside className="w-72 space-y-6 shrink-0">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">CURRENT MODULE</p>
          <h3 className="font-semibold mt-1">AI Generated Quiz</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {quizData.config?.questionType
              ? `${quizData.config.questionType.replace("_", " ")} • ${quizData.config.difficulty}`
              : "Demo Session"}
          </p>
        </div>

        {/* Progress */}
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Progress {answered} / {total}
          </p>
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full">
            <div
              className="h-full bg-indigo-500 transition-all rounded-full"
              style={{ width: `${(answered / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {questions.map((item, i) => {
            const status = results[item.id];
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (results[item.id] !== undefined || i === current) {
                    setCurrent(i);
                    setChecked(!!results[item.id]);
                    setShowExplanation(!!results[item.id]);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition
                  ${
                    i === current
                      ? "bg-indigo-600/15 text-indigo-400"
                      : "bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
              >
                {status?.correct === true && <CheckCircle size={14} className="text-emerald-400" />}
                {status?.correct === false && <XCircle size={14} className="text-red-400" />}
                {status === undefined && <span className="w-3.5 text-center text-xs text-slate-500">{i + 1}</span>}

                <span className="truncate">Q{i + 1}</span>
              </div>
              );
          })}
        </div>

        {/* Accuracy */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">SESSION ACCURACY</p>
          <p className={`text-lg font-semibold ${accuracy >= 70 ? "text-emerald-400" : accuracy >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {accuracy}%
          </p>
        </div>

        {allAnswered && (
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 font-semibold
                       flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Finish & Submit
          </button>
)}
      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 space-y-6">
        {/* Tag */}
        <div className="flex justify-between items-center">
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/15 text-indigo-400 uppercase">
            {q.type?.replace("_", " ") || "Question"}
          </span>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {current + 1} of {total}
            </span>

            <button className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <Flag size={14} /> Flag for review
            </button>
          </div>
        </div>

        {/* Question */}
        <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-8">
          <h1 className="text-2xl font-semibold leading-snug">{q.question}</h1>
        </div>

        {/* Answer area */}
        {q.type === "multiple_choice" && q.options ? (
          <div className="space-y-3">
            {q.options.map((option, i) => {
              const letter = String.fromCharCode(65 + i); // A, B, C, D
              const isSelected = selectedOption === option || selectedOption === letter;
              const isCorrectOption =
                checked &&
                (q.correct_answer?.charAt(0).toUpperCase() === letter ||
                  q.correct_answer?.toLowerCase() === option.toLowerCase());
              const isWrong = checked && isSelected && !isCorrectOption;

              return (
                <button
                  key={i}
                  onClick={() => !checked && setSelectedOption(option)}
                  disabled={checked}
                  className={`w-full text-left rounded-xl border p-4 transition flex items-center gap-3
                    ${
                      isCorrectOption && checked
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : isWrong
                        ? "border-red-500/50 bg-red-500/10"
                        : isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10"
                        : "border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] hover:border-indigo-500/30"
                    }
                    disabled:cursor-default`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                    ${
                      isCorrectOption && checked
                        ? "bg-emerald-500 text-white"
                        : isWrong
                        ? "bg-red-500 text-white"
                        : isSelected
                        ? "bg-indigo-500 text-white"
                        : "bg-black/5 dark:bg-white/10"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm">{option.replace(/^[A-D]\)\s*/, "")}</span>
                </button>
                );
            })}
          </div>
) : q.type === "true_false" ? (
          <div className="flex gap-4">
            {["True", "False"].map((tf) => {
              const isSelected = selectedOption === tf;
              const isCorrect = checked && q.correct_answer?.toLowerCase() === tf.toLowerCase();
              const isWrong = checked && isSelected && !isCorrect;

              return (
                <button
                  key={tf}
                  onClick={() => !checked && setSelectedOption(tf)}
                  disabled={checked}
                  className={`flex-1 py-4 rounded-xl border text-center font-semibold transition
                    ${
                      isCorrect && checked
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : isWrong
                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                        : isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                        : "border-slate-200/70 dark:border-white/10 hover:border-indigo-500/30"
                    }
                    disabled:cursor-default`}
                >
                  {tf}
                </button>
                );
            })}
          </div>
) : (
          /* Short answer */
          <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#070b18] p-6">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full bg-transparent outline-none resize-none text-sm min-h-[120px]"
              disabled={checked}
            />
          </div>
)}

        {/* Explanation */}
        {showExplanation && q.explanation && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="text-xs font-semibold text-indigo-400 mb-1">EXPLANATION</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{q.explanation}</p>
          </div>
)}

        {/* Correct answer display after checking */}
        {checked && (
          <div
            className={`rounded-xl border p-4 ${
              results[q.id]?.correct
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <p className="text-sm font-semibold flex items-center gap-2">
              {results[q.id]?.correct ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Correct!
                </>
) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" /> Incorrect
                </>
)}
            </p>
            {!results[q.id]?.correct && (
              <p className="text-xs text-slate-500 mt-1">
                Correct answer: <span className="text-emerald-400">{q.correct_answer}</span>
              </p>
)}
          </div>
)}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={() => {
                  setCurrent(current - 1);
                  const prev = questions[current - 1];
                  setChecked(!!results[prev.id]);
                  setShowExplanation(!!results[prev.id]);
                  setUserAnswer("");
                  setSelectedOption(null);
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ← Previous
              </button>
)}

            {!checked && (
              <button
                onClick={() => {
                  setResults((prev) => ({ ...prev, [q.id]: { correct: false, userAnswer: "skipped" } }));
                  nextQuestion();
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Skip
              </button>
)}
          </div>

          {!checked ? (
            <button
              onClick={checkAnswer}
              disabled={!userAnswer && !selectedOption}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black font-semibold
                         disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Check Answer →
            </button>
) : current < total - 1 ? (
            <button onClick={nextQuestion} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold">
              Next →
            </button>
) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold
                         flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Finish Quiz
            </button>
)}
        </div>
      </main>
    </div>
    );
}
