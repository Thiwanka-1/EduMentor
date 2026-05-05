import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLessonSessions,
  deleteLessonSession,
} from "../services/dashboardApi.js";

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return date.toLocaleString();
}

function languageLabel(mode) {
  if (mode === "sinhala") return "Sinhala";
  if (mode === "tamil") return "Tamil";
  return "English";
}

function getSessionDate(session) {
  return new Date(session.lastActivityAt || session.updatedAt || session.createdAt);
}

export default function Dashboard() {
  const nav = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("lessons");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data = await getLessonSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSession(id) {
    const ok = window.confirm(
      "Are you sure you want to delete this lesson session? This action cannot be undone."
    );

    if (!ok) return;

    try {
      await deleteLessonSession(id);
      setSessions((prev) => prev.filter((session) => session._id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete lesson session.");
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    return {
      lessons: sessions.length,
      notes: sessions.filter((s) => s.summaryText || s.notesText).length,
      audio: sessions.filter((s) => s.audioUrl).length,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    if (activeTab === "notes") {
      result = result.filter((s) => s.summaryText || s.notesText);
    }

    if (activeTab === "audio") {
      result = result.filter((s) => s.audioUrl);
    }

    const q = searchTerm.trim().toLowerCase();

    if (q) {
      result = result.filter((s) => {
        const combined = [
          s.title,
          s.topic,
          s.languageMode,
          s.summaryText,
          s.notesText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return combined.includes(q);
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);

      result = result.filter((s) => {
        const sessionDate = getSessionDate(s);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate >= from;
      });
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);

      result = result.filter((s) => {
        const sessionDate = getSessionDate(s);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate <= to;
      });
    }

    return result;
  }, [sessions, activeTab, searchTerm, dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="mb-5 rounded-[22px] border border-slate-300 bg-slate-100 px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                Learning Dashboard
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Previous Lessons
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Resume lessons, view saved notes, and replay generated audio.
              </p>
            </div>

            <button
              onClick={() => nav("/lesson")}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Start New Lesson
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Lessons" value={stats.lessons} />
          <StatCard label="Notes" value={stats.notes} />
          <StatCard label="Audio" value={stats.audio} />
        </div>

        <div className="mb-5 rounded-[18px] border border-slate-300 bg-slate-100 p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <TabButton
              label="Previous Lessons"
              value="lessons"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            <TabButton
              label="Saved Notes"
              value="notes"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            <TabButton
              label="Audio Sessions"
              value="audio"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
          </div>
        </div>

        <div className="mb-5 rounded-[18px] border border-slate-300 bg-slate-100 p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Search lessons or notes
              </label>

              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, topic, language, or notes..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                From date
              </label>

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                To date
              </label>

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white"
              />
            </div>
          </div>

          {(searchTerm || dateFrom || dateTo) && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                Showing {filteredSessions.length} matching session
                {filteredSessions.length === 1 ? "" : "s"}
              </p>

              <button
                onClick={clearFilters}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="rounded-[20px] border border-slate-300 bg-slate-100 p-8 text-center text-sm text-slate-600">
            Loading dashboard...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[20px] border border-red-300 bg-red-50 p-5 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && filteredSessions.length === 0 && (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-100 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No sessions found for this tab.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Start a lesson first, then your saved sessions will appear here.
            </p>
          </div>
        )}

        {!loading && !error && filteredSessions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                onResume={() =>
                  nav("/lesson", {
                    state: {
                      sessionId: session._id,
                    },
                  })
                }
                onView={() => nav(`/dashboard/lessons/${session._id}`)}
                onDelete={() => handleDeleteSession(session._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-slate-300 bg-slate-100 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TabButton({ label, value, activeTab, onClick }) {
  const active = activeTab === value;

  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function SessionCard({ session, onResume, onView, onDelete }) {
  const hasDoc = Boolean(session.docId);
  const hasAudio = Boolean(session.audioUrl);
  const hasNotes = Boolean(session.summaryText || session.notesText);

  return (
    <div className="flex min-h-[260px] flex-col rounded-[22px] border border-slate-300 bg-slate-100 p-4 shadow-sm">
      <div className="flex-1">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="line-clamp-2 text-base font-bold text-slate-900">
              {session.title || "Untitled Lesson"}
            </h2>

            <p className="mt-1 line-clamp-1 text-xs text-slate-600">
              {session.topic || "No topic"}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {languageLabel(session.languageMode)}
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <InfoRow label="Created" value={formatDate(session.createdAt)} />

          <InfoRow
            label="Updated"
            value={formatDate(session.lastActivityAt || session.updatedAt)}
          />

          <InfoRow
            label="Document"
            value={hasDoc ? "Attached" : "Not attached"}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasAudio && <Badge label="Audio saved" />}
          {hasNotes && <Badge label="Notes saved" />}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onResume}
          className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
        >
          Resume Chat
        </button>

        <button
          onClick={onView}
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          View Notes
        </button>

        {hasAudio && (
          <a
            href={session.audioUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Play Audio
          </a>
        )}

        <button
          onClick={onDelete}
          className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="truncate text-right text-slate-700">{value}</span>
    </div>
  );
}

function Badge({ label }) {
  return (
    <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      {label}
    </span>
  );
}