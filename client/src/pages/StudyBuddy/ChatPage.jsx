import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../../components/StudyBuddy/AppShell.jsx";
import { api } from "../../lib/api.js";
import { getUserId, setUserId, resetUserId } from "../../lib/user.js";

const WELCOME = {
  _id: "welcome-1",
  role: "assistant",
  content:
    "Heyy, I’m your Study Buddy 😊 Tell me how your day is going or what you’re stuck on right now.",
};

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

function Pill({ children, tone = "neutral" }) {
  const map = {
    neutral:
      "bg-white/60 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10",
    emerald:
      "bg-emerald-400/15 text-emerald-800 ring-emerald-400/25 dark:text-emerald-200",
    indigo:
      "bg-indigo-400/15 text-indigo-800 ring-indigo-400/25 dark:text-indigo-200",
    rose:
      "bg-rose-400/15 text-rose-800 ring-rose-400/25 dark:text-rose-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function SidebarSection({ title, right, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur shadow-[0_14px_55px_-35px_rgba(2,6,23,0.55)] dark:border-white/10 dark:bg-slate-950/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function ChatPage() {
  // user
  const [userId, setUserIdState] = useState(getUserId());

  // sessions + active
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  // messages
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  // uploads
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const [notesText, setNotesText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // rename session
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // UI controls
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("chats"); // chats | uploads | user

  const bottomRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s._id === activeSessionId),
    [sessions, activeSessionId]
  );

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // ---------- SESSIONS ----------
  async function loadSessions(uid = userId) {
    const res = await api.get(`/sessions`, { params: { userId: uid } });
    const list = res.data.sessions || [];
    setSessions(list);
    return list;
  }

  async function createNewSession(uid = userId) {
    const res = await api.post(`/sessions`, {
      userId: uid,
      title: "New Chat",
    });
    const s = res.data.session;
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s._id);
    return s;
  }

  async function openSession(sessionId) {
    setActiveSessionId(sessionId);
    const res = await api.get(`/sessions/${sessionId}/messages`, {
      params: { userId },
    });
    const msgs = res.data.messages || [];
    setMessages(msgs.length ? msgs : [WELCOME]);
  }

  async function deleteSession(sessionId) {
    await api.delete(`/sessions/${sessionId}`, { params: { userId } });
    setSessions((prev) => prev.filter((s) => s._id !== sessionId));

    if (activeSessionId === sessionId) {
      const remaining = sessions.filter((s) => s._id !== sessionId);
      if (remaining.length) {
        await openSession(remaining[0]._id);
      } else {
        const s = await createNewSession();
        await openSession(s._id);
      }
    }
  }

  async function renameSession(sessionId, title) {
    const res = await api.patch(`/sessions/${sessionId}`, { userId, title });
    const updated = res.data.session;
    setSessions((prev) => prev.map((s) => (s._id === sessionId ? updated : s)));
  }

  // first load: sessions -> open latest or create
  useEffect(() => {
    (async () => {
      try {
        const list = await loadSessions(userId);
        if (list.length) {
          await openSession(list[0]._id);
        } else {
          const s = await createNewSession(userId);
          await openSession(s._id);
        }
      } catch (e) {
        console.error("init error:", e);
        setMessages([WELCOME]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ---------- CHAT ----------
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || !activeSessionId) return;

    const userText = trimmed;
    setInput("");

    // optimistic UI
    setMessages((prev) => [
      ...prev,
      { _id: `u-${Date.now()}`, role: "user", content: userText },
    ]);

    setIsSending(true);
    try {
      const res = await api.post(`/chat`, {
        userId,
        sessionId: activeSessionId,
        message: userText,
      });

      const { reply, mood, motivationLevel } = res.data;

      setMessages((prev) => [
        ...prev,
        {
          _id: `a-${Date.now()}`,
          role: "assistant",
          content: reply,
          mood,
          motivationLevel,
        },
      ]);

      // refresh sessions order (latest message)
      const list = await loadSessions(userId);
      setSessions(list);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          _id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "Ahh something broke talking to the server 🧠💥 Try again in a moment?",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // ---------- UPLOADS (PER SESSION) ----------
  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!activeSessionId) return;
    if (!pdfFile || !pdfTitle.trim()) {
      setUploadStatus("Please choose a PDF and give it a title.");
      return;
    }
    setIsUploading(true);
    setUploadStatus("Uploading and indexing your PDF…");

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("userId", userId);
      formData.append("sessionId", activeSessionId);
      formData.append("title", pdfTitle.trim());

      const res = await api.post(`/docs/pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadStatus(`✅ PDF uploaded! Indexed ${res.data.chunks} chunks.`);
      setPdfFile(null);
      setPdfTitle("");
    } catch (err) {
      console.error(err);
      setUploadStatus("❌ Failed to upload PDF. Check server logs and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNotesUpload = async (e) => {
    e.preventDefault();
    if (!activeSessionId) return;
    if (!notesTitle.trim() || !notesText.trim()) {
      setUploadStatus("Please add a title and some text notes.");
      return;
    }
    setIsUploading(true);
    setUploadStatus("Uploading and indexing your notes…");

    try {
      const res = await api.post(`/docs/text`, {
        userId,
        sessionId: activeSessionId,
        title: notesTitle.trim(),
        text: notesText.trim(),
      });

      setUploadStatus(`✅ Notes saved! Indexed ${res.data.chunks} chunks.`);
      setNotesTitle("");
      setNotesText("");
    } catch (err) {
      console.error(err);
      setUploadStatus("❌ Failed to upload notes. Check server logs and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ---------- USER SWITCH ----------
  const [userDraft, setUserDraft] = useState(userId);

  const applyUser = async () => {
    const next = userDraft.trim();
    if (!next) return;
    setUserId(next);
    setUserIdState(next);
    setActiveSessionId(null);
    setSessions([]);
    setMessages([WELCOME]);
    setUploadStatus("");
  };

  const newRandomUser = async () => {
    const next = resetUserId();
    setUserDraft(next);
    setUserIdState(next);
    setActiveSessionId(null);
    setSessions([]);
    setMessages([WELCOME]);
    setUploadStatus("");
  };

  // ---------- UI ----------
  const renderMessage = (m) => {
    const isUser = m.role === "user";

    const bubble = isUser
      ? "bg-emerald-600 text-white rounded-3xl rounded-tr-lg shadow-[0_18px_60px_-45px_rgba(16,185,129,0.85)]"
      : "bg-white/70 text-slate-900 border border-white/60 rounded-3xl rounded-tl-lg dark:bg-slate-950/40 dark:text-slate-100 dark:border-white/10";

    const wrapper = isUser ? "justify-end" : "justify-start";

    return (
      <div key={m._id} className={clsx("flex mb-4", wrapper)}>
        {/* assistant avatar */}
        {!isUser && (
          <div className="mr-3 mt-1 hidden sm:flex">
            <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold">
              S
            </div>
          </div>
        )}

        <div className="max-w-[88%] sm:max-w-[78%]">
          <div className={clsx(bubble, "px-4 py-3 whitespace-pre-wrap text-sm backdrop-blur")}>
            {m.content}
          </div>

          {!isUser && (m.mood || typeof m.motivationLevel === "number") && (
            <div className="mt-2 flex flex-wrap gap-2">
              {m.mood && <Pill tone="indigo">mood: {m.mood}</Pill>}
              {typeof m.motivationLevel === "number" && (
                <Pill tone="emerald">motivation: {m.motivationLevel}/5</Pill>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const SidebarContent = (
    <div className="flex flex-col gap-4">
      {/* Module header card */}
      <div className="rounded-3xl border border-white/60 bg-white/70 p-4 backdrop-blur shadow-[0_14px_55px_-35px_rgba(2,6,23,0.55)] dark:border-white/10 dark:bg-slate-950/40">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900">
          <div className="absolute -top-14 -right-14 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-500/40 via-emerald-400/20 to-transparent blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold opacity-85">StudyBuddy Agent</p>
            <h2 className="mt-1 text-lg font-semibold">Your personal study companion</h2>
            <p className="mt-1 text-xs opacity-80">
              Chats + notes saved per session • RAG-ready
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { k: "chats", label: "Chats" },
            { k: "uploads", label: "Uploads" },
            { k: "user", label: "User" },
          ].map((t) => {
            const active = sidebarTab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setSidebarTab(t.k)}
                className={clsx(
                  "rounded-2xl px-3 py-2 text-xs font-semibold transition border",
                  active
                    ? "bg-emerald-600 text-white border-emerald-500/40 shadow-[0_12px_40px_-30px_rgba(16,185,129,0.8)]"
                    : "bg-white/60 text-slate-700 border-slate-200/70 hover:bg-white/80 dark:bg-slate-950/30 dark:text-slate-200 dark:border-white/10 dark:hover:bg-slate-900/50"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHATS TAB */}
      {sidebarTab === "chats" && (
        <SidebarSection
          title="Chats"
          right={
            <button
              onClick={() => createNewSession()}
              className="rounded-2xl px-3 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition"
            >
              + New
            </button>
          }
        >
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2">
            {sessions.map((s) => {
              const active = s._id === activeSessionId;

              return (
                <div
                  key={s._id}
                  className={clsx(
                    "group rounded-2xl border p-3 transition",
                    active
                      ? "border-emerald-500/40 bg-white/70 dark:bg-slate-950/45 dark:border-emerald-500/30"
                      : "border-slate-200/70 bg-white/50 hover:bg-white/80 dark:border-white/10 dark:bg-slate-950/25 dark:hover:bg-slate-900/40"
                  )}
                >
                  {renamingId === s._id ? (
                    <div className="flex gap-2">
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="flex-1 rounded-xl bg-white/70 border border-slate-200 px-3 py-2 text-xs
                                   text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                                   dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100"
                      />
                      <button
                        onClick={async () => {
                          await renameSession(s._id, renameValue);
                          setRenamingId(null);
                        }}
                        className="rounded-xl px-3 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        openSession(s._id);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left"
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {s.title || "New Chat"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}
                      </p>
                    </button>
                  )}

                  <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setRenamingId(s._id);
                        setRenameValue(s.title || "");
                      }}
                      className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200/70 bg-white/60 hover:bg-white
                                 text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 dark:text-slate-200"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => deleteSession(s._id)}
                      className="text-[11px] px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {!sessions.length && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                No chats yet…
              </div>
            )}
          </div>
        </SidebarSection>
      )}

      {/* UPLOADS TAB */}
      {sidebarTab === "uploads" && (
        <>
          <SidebarSection title="Upload PDF (this chat)">
            <form onSubmit={handlePdfUpload} className="space-y-2">
              <input
                type="text"
                className="w-full rounded-2xl bg-white/70 border border-slate-200 px-3 py-2 text-xs
                           text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                           dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Title (e.g., DevOps Lecture 06)"
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
              />
              <input
                type="file"
                accept="application/pdf"
                className="w-full text-xs text-slate-600 dark:text-slate-300
                           file:text-xs file:px-3 file:py-2 file:rounded-xl file:border-0
                           file:bg-emerald-600 file:text-white file:hover:bg-emerald-500 file:transition"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              <button
                type="submit"
                disabled={isUploading || !activeSessionId}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500
                           disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 text-xs font-semibold transition text-white"
              >
                {isUploading ? "Uploading…" : "Upload PDF"}
              </button>
            </form>
          </SidebarSection>

          <SidebarSection title="Quick text notes (this chat)">
            <form onSubmit={handleNotesUpload} className="space-y-2">
              <input
                type="text"
                className="w-full rounded-2xl bg-white/70 border border-slate-200 px-3 py-2 text-xs
                           text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                           dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Title (e.g., Deadlock summary)"
                value={notesTitle}
                onChange={(e) => setNotesTitle(e.target.value)}
              />
              <textarea
                rows={4}
                className="w-full rounded-2xl bg-white/70 border border-slate-200 px-3 py-2 text-xs
                           text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none
                           dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Paste short notes here…"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
              <button
                type="submit"
                disabled={isUploading || !activeSessionId}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500
                           disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 text-xs font-semibold transition text-white"
              >
                {isUploading ? "Uploading…" : "Save notes"}
              </button>
            </form>
          </SidebarSection>

          {uploadStatus && (
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-[11px] text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
              {uploadStatus}
            </div>
          )}
        </>
      )}

      {/* USER TAB */}
      {sidebarTab === "user" && (
        <SidebarSection title="User identity">
          <div className="space-y-2">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              This is your demo user switch (no auth yet).
            </div>
            <div className="flex gap-2">
              <input
                value={userDraft}
                onChange={(e) => setUserDraft(e.target.value)}
                className="flex-1 rounded-2xl bg-white/70 border border-slate-200 px-3 py-2 text-xs
                           text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                           dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="user id"
              />
              <button
                onClick={applyUser}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition"
              >
                Apply
              </button>
            </div>

            <button
              onClick={newRandomUser}
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white px-4 py-2 text-xs font-semibold
                         text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 dark:text-slate-200 transition"
            >
              New random user
            </button>

            <div className="pt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div>
                Active chat:{" "}
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {activeSessionId || "none"}
                </span>
              </div>
              <div>
                Backend:{" "}
                <span className="text-emerald-700 dark:text-emerald-400">
                  {import.meta.env.VITE_API_BASE_URL ||
                    "http://localhost:3000/api"}
                </span>
              </div>
            </div>
          </div>
        </SidebarSection>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[360px] shrink-0">
          {SidebarContent}
        </aside>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[92%] max-w-[420px] p-4 overflow-y-auto">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 backdrop-blur p-2">
                {SidebarContent}
              </div>
            </div>
          </div>
        )}

        {/* Main chat area */}
        <main
          className="flex-1 flex flex-col rounded-[28px] border border-white/60 bg-white/70
                     shadow-[0_18px_90px_-55px_rgba(2,6,23,0.65)]
                     backdrop-blur dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
        >
          {/* Chat header */}
          <header className="px-4 sm:px-6 py-4 border-b border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <div className="max-w-4xl mx-auto flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {activeSession?.title || "Study Buddy"}
                  </p>
                  <Pill tone="emerald">Live</Pill>
                </div>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                  Ask questions • Upload notes per chat • Keep context clean
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden rounded-2xl border border-slate-200/70 bg-white/70 hover:bg-white px-3 py-2 text-xs font-semibold
                             text-slate-700 dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 dark:text-slate-200 transition"
                >
                  Menu
                </button>

                <button
                  onClick={() => createNewSession()}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition"
                >
                  + New chat
                </button>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <div className="max-w-4xl mx-auto">
              {messages.map(renderMessage)}

              {isSending && (
                <div className="flex justify-start mb-4">
                  <div className="rounded-3xl rounded-tl-lg px-4 py-2 text-xs flex items-center gap-2
                                  border border-slate-200/70 bg-white/70 text-slate-700 backdrop-blur
                                  dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Study Buddy is thinking…
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Composer */}
          <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <form
              onSubmit={handleSend}
              className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-end gap-2"
            >
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question… (Enter = send, Shift+Enter = new line)"
                    className="w-full rounded-[22px] bg-white/80 border border-slate-200 px-4 py-3 text-sm
                               text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent resize-none
                               dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-100 dark:placeholder:text-slate-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />

                  {/* glow line */}
                  <div className="pointer-events-none absolute inset-x-6 -bottom-2 h-6 bg-gradient-to-r from-transparent via-emerald-500/18 to-transparent blur-xl" />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill>Tip: upload notes for better answers</Pill>
                  <Pill tone="indigo">Per-session memory</Pill>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending || !input.trim() || !activeSessionId}
                className="shrink-0 rounded-[22px] bg-emerald-600 hover:bg-emerald-500
                           disabled:opacity-60 disabled:cursor-not-allowed
                           text-sm font-semibold px-5 py-3 transition text-white
                           shadow-[0_14px_55px_-40px_rgba(16,185,129,0.9)]"
              >
                {isSending ? "Sending…" : "Send"}
              </button>
            </form>
          </footer>
        </main>
      </div>
    </AppShell>
  );
}
