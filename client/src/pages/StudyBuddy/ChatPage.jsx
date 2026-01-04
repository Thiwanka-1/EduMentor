// client/src/pages/ChatPage.jsx
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
      ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm"
      : "bg-white/70 text-slate-900 border border-emerald-500/25 rounded-2xl rounded-tl-sm dark:bg-slate-950/40 dark:text-slate-50 dark:border-emerald-500/40";

    const metaChip =
      "px-2 py-0.5 rounded-full bg-white/60 text-slate-600 ring-1 ring-slate-200 " +
      "dark:bg-white/10 dark:text-slate-200 dark:ring-white/10";

    return (
      <div
        key={m._id}
        className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div className="max-w-[82%]">
          <div className={`${bubble} px-4 py-3 shadow-sm whitespace-pre-wrap text-sm`}>
            {m.content}
          </div>

          {!isUser && (m.mood || typeof m.motivationLevel === "number") && (
            <div className="mt-1 flex gap-2 text-[11px]">
              {m.mood && <span className={metaChip}>mood: {m.mood}</span>}
              {typeof m.motivationLevel === "number" && (
                <span className={metaChip}>motivation: {m.motivationLevel}/5</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="flex gap-4">
        {/* Sidebar */}
        <aside className="hidden md:flex w-80 flex-col gap-4">
          <div
            className="rounded-3xl border border-slate-200/70 bg-white/70 p-4
                       shadow-[0_14px_55px_-35px_rgba(2,6,23,0.55)]
                       backdrop-blur
                       dark:border-white/10 dark:bg-slate-950/40"
          >
            <div>
              <h1 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                Study Buddy Agent
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chats are saved. Upload notes per chat like ChatGPT.
              </p>
            </div>

            {/* User switch */}
            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">
                User
              </div>
              <div className="flex gap-2">
                <input
                  value={userDraft}
                  onChange={(e) => setUserDraft(e.target.value)}
                  className="flex-1 rounded-xl bg-white/70 border border-slate-200 px-3 py-1.5 text-xs
                             text-slate-900 placeholder:text-slate-400
                             focus:outline-none focus:ring-1 focus:ring-emerald-500
                             dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-50 dark:placeholder:text-slate-500"
                  placeholder="user id"
                />
                <button
                  onClick={applyUser}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Apply
                </button>
              </div>
              <button
                onClick={newRandomUser}
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white px-3 py-1.5 text-xs
                           text-slate-700
                           dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 dark:text-slate-200 transition"
              >
                New random user
              </button>
            </div>

            {/* Sessions */}
            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Chats
                </div>
                <button
                  onClick={() => createNewSession()}
                  className="text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-white"
                >
                  + New
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {sessions.map((s) => {
                  const active = s._id === activeSessionId;

                  const card = active
                    ? "border-emerald-500/40 bg-white/70 dark:bg-slate-950/45"
                    : "border-slate-200/70 bg-white/50 hover:bg-white/70 dark:border-white/10 dark:bg-slate-950/25 dark:hover:bg-slate-950/40";

                  return (
                    <div
                      key={s._id}
                      className={`group rounded-xl border ${card} p-2 transition`}
                    >
                      {renamingId === s._id ? (
                        <div className="flex gap-2">
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="flex-1 rounded-lg bg-white/70 border border-slate-200 px-2 py-1 text-xs
                                       text-slate-900
                                       dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-50"
                          />
                          <button
                            onClick={async () => {
                              await renameSession(s._id, renameValue);
                              setRenamingId(null);
                            }}
                            className="text-xs rounded-lg bg-emerald-600 px-2 py-1 text-white"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openSession(s._id)}
                          className="w-full text-left"
                        >
                          <div className="text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                            {s.title || "New Chat"}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}
                          </div>
                        </button>
                      )}

                      <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setRenamingId(s._id);
                            setRenameValue(s.title || "");
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg border border-slate-200/70 bg-white/60 hover:bg-white
                                     text-slate-700
                                     dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 dark:text-slate-200"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteSession(s._id)}
                          className="text-[11px] px-2 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white"
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
            </div>

            {/* Uploads */}
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <h2 className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-300">
                  Upload PDF notes (this chat)
                </h2>
                <form onSubmit={handlePdfUpload} className="space-y-2">
                  <input
                    type="text"
                    className="w-full rounded-xl bg-white/70 border border-slate-200 px-3 py-1.5 text-xs
                               text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-1 focus:ring-emerald-500
                               dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-50 dark:placeholder:text-slate-500"
                    placeholder="Title (e.g., DevOps Lecture 06)"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="application/pdf"
                    className="w-full text-xs text-slate-600 dark:text-slate-300
                               file:text-xs file:px-3 file:py-1.5 file:rounded-lg file:border-0
                               file:bg-emerald-600 file:text-white file:hover:bg-emerald-500"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="submit"
                    disabled={isUploading || !activeSessionId}
                    className="w-full mt-1 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500
                               disabled:opacity-60 disabled:cursor-not-allowed px-3 py-1.5 transition text-white"
                  >
                    {isUploading ? "Uploading…" : "Upload PDF"}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/30">
                <h2 className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-300">
                  Quick text notes (this chat)
                </h2>
                <form onSubmit={handleNotesUpload} className="space-y-2">
                  <input
                    type="text"
                    className="w-full rounded-xl bg-white/70 border border-slate-200 px-3 py-1.5 text-xs
                               text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-1 focus:ring-emerald-500
                               dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-50 dark:placeholder:text-slate-500"
                    placeholder="Title (e.g., Deadlock summary)"
                    value={notesTitle}
                    onChange={(e) => setNotesTitle(e.target.value)}
                  />
                  <textarea
                    rows={4}
                    className="w-full rounded-xl bg-white/70 border border-slate-200 px-3 py-1.5 text-xs
                               text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none
                               dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-50 dark:placeholder:text-slate-500"
                    placeholder="Paste short notes here…"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isUploading || !activeSessionId}
                    className="w-full mt-1 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500
                               disabled:opacity-60 disabled:cursor-not-allowed px-3 py-1.5 transition text-white"
                  >
                    {isUploading ? "Uploading…" : "Save notes"}
                  </button>
                </form>
              </div>

              {uploadStatus && (
                <div className="text-[11px] text-slate-700 dark:text-slate-200 bg-white/60 border border-slate-200/70 rounded-xl px-3 py-2 backdrop-blur dark:bg-slate-950/30 dark:border-white/10">
                  {uploadStatus}
                </div>
              )}

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  Active chat:{" "}
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {activeSessionId || "none"}
                  </span>
                </div>
                <div className="mt-1">
                  Backend:{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main
          className="flex-1 flex flex-col rounded-3xl border border-slate-200/70 bg-white/70
                     shadow-[0_18px_80px_-45px_rgba(2,6,23,0.55)]
                     backdrop-blur
                     dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
        >
          <header className="px-4 py-3 border-b border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
                  {activeSession?.title || "Study Buddy"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Your buddy + your notes for this chat.
                </div>
              </div>
              <button
                onClick={() => createNewSession()}
                className="md:hidden text-xs rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-white"
              >
                + New chat
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
            <div className="max-w-3xl mx-auto">
              {messages.map(renderMessage)}
              {isSending && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white/70 text-slate-700 border border-slate-200/70 rounded-2xl rounded-tl-sm px-4 py-2 text-xs flex items-center gap-2 backdrop-blur dark:bg-slate-950/40 dark:text-slate-200 dark:border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Study Buddy is thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <form
              onSubmit={handleSend}
              className="max-w-3xl mx-auto px-3 sm:px-6 py-3 flex items-end gap-2"
            >
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me how you’re feeling or what you’re stuck on…"
                className="flex-1 rounded-2xl bg-white/70 border border-slate-200 px-3 py-2 text-sm
                           text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none
                           dark:bg-slate-950/40 dark:border-white/10 dark:text-slate-50 dark:placeholder:text-slate-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim() || !activeSessionId}
                className="shrink-0 rounded-2xl bg-emerald-600 hover:bg-emerald-500
                           disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium px-4 py-2 transition text-white"
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
