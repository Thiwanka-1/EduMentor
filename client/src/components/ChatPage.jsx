// client/src/pages/ChatPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

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
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch logged-in user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser({
          ...res.data,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.data.name}&backgroundColor=c0aede`,
        });
      } catch (err) {
        // If not logged in, boot them to the login page
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

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

  // ---------- SESSIONS (No userId needed anymore!) ----------
  async function loadSessions() {
    const res = await api.get(`/sessions`);
    const list = res.data.sessions || [];
    setSessions(list);
    return list;
  }

  async function createNewSession() {
    const res = await api.post(`/sessions`, { title: "New Chat" });
    const s = res.data.session;
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s._id);
    setIsMobileMenuOpen(false);
    return s;
  }

  async function openSession(sessionId) {
    setActiveSessionId(sessionId);
    setIsMobileMenuOpen(false);
    const res = await api.get(`/sessions/${sessionId}/messages`);
    const msgs = res.data.messages || [];
    setMessages(msgs.length ? msgs : [WELCOME]);
  }

  async function deleteSession(sessionId) {
    await api.delete(`/sessions/${sessionId}`);
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
    const res = await api.patch(`/sessions/${sessionId}`, { title });
    const updated = res.data.session;
    setSessions((prev) => prev.map((s) => (s._id === sessionId ? updated : s)));
  }

  useEffect(() => {
    // Only load sessions once we confirm the user is logged in
    if (!user) return;
    
    (async () => {
      try {
        const list = await loadSessions();
        if (list.length) {
          await openSession(list[0]._id);
        } else {
          const s = await createNewSession();
          await openSession(s._id);
        }
      } catch (e) {
        console.error("init error:", e);
        setMessages([WELCOME]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------- CHAT ----------
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
        sessionId: activeSessionId,
        message: userText,
      });

      const { reply, mood, motivationLevel } = res.data;

      setMessages((prev) => [
        ...prev,
        { _id: `a-${Date.now()}`, role: "assistant", content: reply, mood, motivationLevel },
      ]);

      const list = await loadSessions();
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

  // ---------- UPLOADS ----------
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

  const primaryGradientBtn = "bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white border-0 shadow-sm transition-all";

  // Prevent rendering until user is fetched
  if (!user) return null;

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 flex transition-colors duration-200 relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        uiProps={{ isMobileMenuOpen, setIsMobileMenuOpen }}
        // We pass dummy functions for userProps temporarily so the old Sidebar doesn't crash.
        // We will remove these completely when we update Sidebar.jsx!
        userProps={{ userDraft: "", setUserDraft: () => {}, applyUser: () => {}, newRandomUser: () => {} }}
        sessionProps={{ 
          sessions, activeSessionId, createNewSession, openSession, deleteSession, 
          renameSession, renamingId, setRenamingId, renameValue, setRenameValue 
        }}
        uploadProps={{ 
          handlePdfUpload, pdfTitle, setPdfTitle, setPdfFile, isUploading, 
          handleNotesUpload, notesTitle, setNotesTitle, notesText, setNotesText, uploadStatus 
        }}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="px-4 py-3 border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:text-indigo-600 transition focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <div className="text-sm text-indigo-600 font-bold">
                  {activeSession?.title || "Study Buddy"}
                </div>
                <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
                  Your buddy + your notes for this chat.
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block">
                Home
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border-2 border-indigo-100 hover:border-indigo-300 transition-colors object-cover bg-slate-50"
                  />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/" className="block sm:hidden px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600">Home</Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600">Profile</Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 mt-1 border-t border-slate-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => createNewSession()}
                className={`md:hidden text-xs rounded-xl px-3 py-2 font-bold shadow-md ${primaryGradientBtn}`}
              >
                + New
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto">
            
            {messages.map((m) => (
              <ChatMessage key={m._id} message={m} />
            ))}

            {isSending && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-2 text-xs font-medium flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Study Buddy is thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white/90 backdrop-blur sticky bottom-0 z-20">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto px-3 sm:px-6 py-4 flex items-end gap-3">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me how you’re feeling or what you’re stuck on…"
              className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors resize-none shadow-sm"
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
              className={`shrink-0 rounded-2xl text-sm font-bold px-5 py-3 shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${primaryGradientBtn}`}
            >
              {isSending ? "Sending…" : "Send"}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}