import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLessonSessions } from "../services/dashboardApi.js";

export default function AudioSessionsPage() {
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
      setError(err.message || "Failed to load audio sessions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  const audioSessions = useMemo(
    () => sessions.filter((session) => session.audioUrl),
    [sessions]
  );

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <div className="mb-4 rounded-[22px] border border-slate-300 bg-slate-100 p-5 shadow-sm">
          <button
            onClick={() => nav("/dashboard")}
            className="mb-3 text-xs font-semibold text-indigo-600 hover:underline"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-2xl font-bold">Audio Sessions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Replay generated lesson audio from previous sessions.
          </p>
        </div>

        {loading && <MessageBox text="Loading audio sessions..." />}
        {!loading && error && <MessageBox text={error} error />}
        {!loading && !error && audioSessions.length === 0 && (
          <MessageBox text="No audio sessions saved yet." />
        )}

        <div className="space-y-4">
          {audioSessions.map((session) => (
            <div
              key={session._id}
              className="rounded-[22px] border border-slate-300 bg-slate-100 p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{session.title}</h2>
                  <p className="text-xs text-slate-600">{session.topic}</p>
                </div>

                <button
                  onClick={() => nav(`/dashboard/lessons/${session._id}`)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  View Notes
                </button>
              </div>

              <audio controls src={session.audioUrl} className="w-full" />
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