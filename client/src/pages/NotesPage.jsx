import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLessonSessionById,
  updateLessonNotes,
} from "../services/dashboardApi.js";

function formatDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

export default function NotesPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [session, setSession] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  async function loadSession() {
    try {
      setLoading(true);
      setError("");

      const data = await getLessonSessionById(id);
      setSession(data.session);
      setNotesText(data.session?.notesText || "");
    } catch (err) {
      setError(err.message || "Failed to load lesson.");
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    try {
      setSaving(true);
      setSaveMessage("");

      const data = await updateLessonNotes(id, notesText);
      setSession(data.session);
      setSaveMessage("Notes saved successfully.");
    } catch (err) {
      setSaveMessage(err.message || "Failed to save notes.");
    } finally {
      setSaving(false);
    }
  }

  function downloadNotes() {
    const blob = new Blob([notesText || ""], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session?.title || "lesson-notes"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    loadSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-200 p-6 text-slate-700">
        Loading lesson notes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-200 p-6">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 rounded-[22px] border border-slate-300 bg-slate-100 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                onClick={() => nav("/dashboard")}
                className="mb-3 text-xs font-semibold text-indigo-600 hover:underline"
              >
                ← Back to Dashboard
              </button>

              <h1 className="text-2xl font-bold text-slate-900">
                {session?.title || "Lesson Notes"}
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                {session?.topic || "No topic"} · {formatDate(session?.createdAt)}
              </p>
            </div>

            <button
              onClick={() =>
                nav("/lesson", {
                  state: {
                    sessionId: session?._id,
                  },
                })
              }
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Resume Lesson
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-[22px] border border-slate-300 bg-slate-100 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900">Saved Notes</h2>

                <div className="flex gap-2">
                  <button
                    onClick={downloadNotes}
                    disabled={!notesText}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download
                  </button>

                  <button
                    onClick={saveNotes}
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>

              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="No notes saved yet."
                className="h-[520px] w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm leading-7 text-slate-800 outline-none focus:border-indigo-400 focus:bg-white"
              />

              {saveMessage && (
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  {saveMessage}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[22px] border border-slate-300 bg-slate-100 p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-slate-900">
                Lesson Media
              </h2>

              <div className="space-y-3">
                {session?.audioUrl ? (
                  <audio controls src={session.audioUrl} className="w-full" />
                ) : (
                  <MediaEmpty label="No audio saved yet." />
                )}

                {session?.videoUrl ? (
                  <video controls src={session.videoUrl} className="w-full rounded-xl" />
                ) : (
                  <MediaEmpty label="No video saved yet." />
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-300 bg-slate-100 p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-slate-900">
                Conversation History
              </h2>

              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {(session?.messages || []).map((m, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-300 bg-slate-50 p-3"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      {m.role}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">
                      {m.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaEmpty({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
      {label}
    </div>
  );
}