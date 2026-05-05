import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLessonSessions } from "../services/dashboardApi.js";

export default function QuizResultsPage() {
  const nav = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSessions() {
    try {
      setLoading(true);
      setError("");

      const data = await getLessonSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || "Failed to load quiz results.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  const quizSessions = useMemo(
    () =>
      sessions.filter(
        (session) => Array.isArray(session.quizHistory) && session.quizHistory.length > 0
      ),
    [sessions]
  );

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 rounded-[22px] border border-slate-300 bg-slate-100 p-5 shadow-sm">
          <button
            onClick={() => nav("/dashboard")}
            className="mb-3 text-xs font-semibold text-indigo-600 hover:underline"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold">Quiz Results</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review quiz results from previous lesson sessions.
          </p>
        </div>

        {loading && <MessageBox text="Loading quiz results..." />}
        {!loading && error && <MessageBox text={error} error />}
        {!loading && !error && quizSessions.length === 0 && (
          <MessageBox text="No quiz results saved yet. This will be used in Phase 6." />
        )}

        <div className="space-y-4">
          {quizSessions.map((session) => (
            <div
              key={session._id}
              className="rounded-[22px] border border-slate-300 bg-slate-100 p-4 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{session.title}</h2>
                  <p className="text-xs text-slate-600">{session.topic}</p>
                </div>

                <button
                  onClick={() => nav(`/dashboard/lessons/${session._id}`)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  View Lesson
                </button>
              </div>

              <div className="space-y-3">
                {(session.quizHistory || []).map((quiz, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-3"
                  >
                    <p className="text-xs font-bold text-slate-900">
                      Q{index + 1}. {quiz.question}
                    </p>

                    {Array.isArray(quiz.options) && quiz.options.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                        {quiz.options.map((option, optionIndex) => (
                          <li key={optionIndex}>{option}</li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                      <p>
                        <span className="font-bold">Your answer:</span>{" "}
                        {quiz.userAnswer || "Not answered"}
                      </p>
                      <p>
                        <span className="font-bold">Correct:</span>{" "}
                        {quiz.correctAnswer || "N/A"}
                      </p>
                      <p>
                        <span className="font-bold">Score:</span>{" "}
                        {quiz.score ?? "N/A"}
                      </p>
                    </div>

                    {quiz.explanation && (
                      <p className="mt-2 text-xs leading-5 text-slate-700">
                        {quiz.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBox({ text, error = false }) {
  return (
    <div
      className={`rounded-[20px] border p-5 text-sm ${
        error
          ? "border-red-300 bg-red-50 text-red-600"
          : "border-slate-300 bg-slate-100 text-slate-600"
      }`}
    >
      {text}
    </div>
  );
}