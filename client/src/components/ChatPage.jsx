// client/src/pages/ChatPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api.js";
import { getUserId, setUserId, resetUserId } from "../lib/user.js";

// Components
import Sidebar from "../components/Sidebar.jsx";
import ChatMessage from "../components/ChatMessage.jsx";

const WELCOME = {
  _id: "welcome-1",
  role: "assistant",
  content:
    "Heyy, I’m your Study Buddy 😊 Tell me how your day is going or what you’re stuck on right now.",
};

export default function ChatPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const [userId, setUserIdState] = useState(getUserId());
  const [userDraft, setUserDraft] = useState(userId);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
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

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const bottomRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s._id === activeSessionId),
    [sessions, activeSessionId]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function loadSessions(uid = userId) {
    const res = await api.get(`/sessions`, { params: { userId: uid } });
    const list = res.data.sessions || [];
    setSessions(list);
    return list;
  }

  async function createNewSession(uid = userId) {
    const res = await api.post(`/sessions`, { userId: uid, title: "New Chat" });
    const s = res.data.session;
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s._id);
    setIsMobileMenuOpen(false);
    return s;
  }

  async function openSession(sessionId) {
    setActiveSessionId(sessionId);
    setIsMobileMenuOpen(false);
    const res = await api.get(`/sessions/${sessionId}/messages`, { params: { userId } });
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
  }, [userId]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending || !activeSessionId) return;

    const userText = trimmed;
    setInput("");

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
        { _id: `a-${Date.now()}`, role: "assistant", content: reply, mood, motivationLevel },
      ]);

      const list = await loadSessions(userId);
      setSessions(list);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { _id: `err-${Date.now()}`, role: "assistant", content: "Ahh something broke 🧠💥 Try again in a moment?" },
      ]);
    } finally {
      setIsSending(false);
    }
  };

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

  const primaryGradientBtn = "bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white border-0 shadow-sm transition-all";

  return (
    <div className="min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex transition-colors duration-200 relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        uiProps={{ isMobileMenuOpen, setIsMobileMenuOpen }}
        userProps={{ userDraft, setUserDraft, applyUser, newRandomUser }}
        sessionProps={{ 
          sessions, activeSessionId, createNewSession, openSession, deleteSession, 
          renameSession, renamingId, setRenamingId, renameValue, setRenameValue 
        }}
        uploadProps={{ 
          handlePdfUpload, pdfTitle, setPdfTitle, setPdfFile, isUploading, 
          handleNotesUpload, notesTitle, setNotesTitle, notesText, setNotesText, uploadStatus 
        }}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur sticky top-0 z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition focus:outline-none"
              >
                ☰
              </button>
              <div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">
                  {activeSession?.title || "Study Buddy"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Your buddy + your notes for this chat.
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none"
                title="Toggle Light/Dark Mode"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => createNewSession()}
                className={`md:hidden text-xs rounded-xl px-3 py-2 ${primaryGradientBtn}`}
              >
                + New
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            
            {messages.map((m) => (
              <ChatMessage key={m._id} message={m} />
            ))}

            {isSending && (
              <div className="flex justify-start mb-3">
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-indigo-500/40 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm px-4 py-2 text-xs flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Study Buddy is thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur sticky bottom-0 z-20">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto px-3 sm:px-6 py-3 flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me how you’re feeling or what you’re stuck on…"
              className="flex-1 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
              className={`shrink-0 rounded-2xl text-sm font-medium px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed ${primaryGradientBtn}`}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}