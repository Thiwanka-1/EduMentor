// client/src/components/Sidebar.jsx
import React from "react";

export default function Sidebar({ uiProps, userProps, sessionProps, uploadProps }) {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = uiProps;
  const { userDraft, setUserDraft, applyUser, newRandomUser } = userProps;
  const { 
    sessions, activeSessionId, createNewSession, openSession, deleteSession, 
    renameSession, renamingId, setRenamingId, renameValue, setRenameValue 
  } = sessionProps;
  const { 
    handlePdfUpload, pdfTitle, setPdfTitle, setPdfFile, isUploading, 
    handleNotesUpload, notesTitle, setNotesTitle, notesText, setNotesText, uploadStatus 
  } = uploadProps;

  // The signature gradient from your screenshots
  const primaryGradientBtn = "bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white border-0 shadow-sm transition-all";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-80 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 gap-4 
        transform transition-transform duration-300 md:relative md:translate-x-0 md:flex
        ${isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full hidden"}
      `}
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">
            Study Buddy Agent
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chats are saved. Upload notes per chat.
          </p>
        </div>
        <button
          className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>
      </div>

      {/* User switch */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2">User</div>
        <div className="flex gap-2">
          <input
            value={userDraft}
            onChange={(e) => setUserDraft(e.target.value)}
            className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            placeholder="user id"
          />
          <button
            onClick={applyUser}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium ${primaryGradientBtn}`}
          >
            Apply
          </button>
        </div>
        <button
          onClick={newRandomUser}
          className="mt-2 w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition"
        >
          New random user
        </button>
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm flex-1 md:flex-none overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Chats</div>
          <button
            onClick={() => createNewSession()}
            className={`text-xs rounded-lg px-2 py-1 ${primaryGradientBtn}`}
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {sessions.map((s) => {
            const active = s._id === activeSessionId;
            return (
              <div
                key={s._id}
                className={`group rounded-xl border ${
                  active
                    ? "border-indigo-400/60 bg-indigo-50/50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900"
                } p-2 transition`}
              >
                {renamingId === s._id ? (
                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={async () => {
                        await renameSession(s._id, renameValue);
                        setRenamingId(null);
                      }}
                      className="text-xs rounded-lg bg-indigo-600 text-white px-2 py-1 hover:bg-indigo-500"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openSession(s._id)} className="w-full text-left">
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-100 line-clamp-1">
                      {s.title || "New Chat"}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
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
                    className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => deleteSession(s._id)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!sessions.length && <div className="text-xs text-slate-500">No chats yet…</div>}
        </div>
      </div>

      {/* Uploads */}
      <div className="space-y-4 overflow-y-auto flex-none pb-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
          <h2 className="text-sm font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
            Upload PDF notes (this chat)
          </h2>
          <form onSubmit={handlePdfUpload} className="space-y-2">
            <input
              type="text"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              placeholder="Title (e.g., DevOps Lecture 06)"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
            />
            <input
              type="file"
              accept="application/pdf"
              className="w-full text-xs text-slate-700 dark:text-slate-300 file:text-xs file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700 file:hover:bg-indigo-200 dark:file:bg-indigo-900/50 dark:file:text-indigo-300 dark:file:hover:bg-indigo-800/50 file:cursor-pointer file:transition file:font-medium"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            <button
              type="submit"
              disabled={isUploading || !activeSessionId}
              className={`w-full mt-1 text-xs font-medium rounded-xl px-3 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${primaryGradientBtn}`}
            >
              {isUploading ? "Uploading…" : "Upload PDF"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
          <h2 className="text-sm font-semibold mb-2 text-indigo-600 dark:text-indigo-400">
            Quick text notes (this chat)
          </h2>
          <form onSubmit={handleNotesUpload} className="space-y-2">
            <input
              type="text"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              placeholder="Title (e.g., Deadlock summary)"
              value={notesTitle}
              onChange={(e) => setNotesTitle(e.target.value)}
            />
            <textarea
              rows={4}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none text-slate-900 dark:text-slate-100"
              placeholder="Paste short notes here…"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
            <button
              type="submit"
              disabled={isUploading || !activeSessionId}
              className={`w-full mt-1 text-xs font-medium rounded-xl px-3 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${primaryGradientBtn}`}
            >
              {isUploading ? "Uploading…" : "Save notes"}
            </button>
          </form>
        </div>

        {uploadStatus && (
          <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
            {uploadStatus}
          </div>
        )}

        <div className="text-[11px] text-slate-500 dark:text-slate-500">
          <div>
            Active chat: <span className="font-mono text-slate-700 dark:text-slate-300">{activeSessionId || "none"}</span>
          </div>
          <div className="mt-1">
            Backend: <span className="text-indigo-500 dark:text-indigo-400">{import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}