// client/src/components/Sidebar.jsx
import React from "react";

export default function Sidebar({ uiProps, sessionProps, uploadProps }) {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = uiProps;
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
        fixed inset-y-0 left-0 z-50 w-80 flex-col border-r border-slate-200 bg-slate-50 p-4 gap-4 
        transform transition-transform duration-300 md:relative md:translate-x-0 md:flex
        ${isMobileMenuOpen ? "translate-x-0 flex shadow-2xl" : "-translate-x-full hidden"}
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 tracking-tight">
            Study Buddy Agent
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Chats are saved securely.
          </p>
        </div>
        <button
          className="md:hidden text-slate-500 hover:text-rose-500 p-1 bg-white rounded-lg border border-slate-200 shadow-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          ✕
        </button>
      </div>

      {/* Sessions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex-1 md:flex-none overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-indigo-600 uppercase tracking-wide">Recent Chats</div>
          <button
            onClick={() => createNewSession()}
            className={`text-xs font-bold rounded-lg px-3 py-1.5 ${primaryGradientBtn}`}
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
                    ? "border-indigo-400 bg-indigo-50/50 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                } p-2 transition-all`}
              >
                {renamingId === s._id ? (
                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 rounded-lg bg-white border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={async () => {
                        await renameSession(s._id, renameValue);
                        setRenamingId(null);
                      }}
                      className="text-xs font-bold rounded-lg bg-indigo-600 text-white px-3 py-1.5 hover:bg-indigo-500 shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openSession(s._id)} className="w-full text-left">
                    <div className={`text-sm font-bold line-clamp-1 ${active ? "text-indigo-700" : "text-slate-700"}`}>
                      {s.title || "New Chat"}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 mt-1">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}
                    </div>
                  </button>
                )}

                <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setRenamingId(s._id);
                      setRenameValue(s.title || "");
                    }}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => deleteSession(s._id)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!sessions.length && <div className="text-xs font-medium text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No chats yet…</div>}
        </div>
      </div>

      {/* Uploads Section */}
      <div className="space-y-4 overflow-y-auto flex-none pb-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full blur-xl pointer-events-none"></div>
          
          <h2 className="text-sm font-bold mb-3 text-indigo-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Upload PDF Notes
          </h2>
          <form onSubmit={handlePdfUpload} className="space-y-3 relative z-10">
            <input
              type="text"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
              placeholder="Title (e.g., DevOps Lecture 06)"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
            />
            <input
              type="file"
              accept="application/pdf"
              className="w-full text-xs text-slate-600 file:mr-3 file:text-xs file:font-bold file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-600 file:hover:bg-indigo-100 file:cursor-pointer file:transition-colors cursor-pointer"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            <button
              type="submit"
              disabled={isUploading || !activeSessionId}
              className={`w-full text-xs font-bold rounded-xl px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${primaryGradientBtn}`}
            >
              {isUploading ? "Uploading…" : "Process PDF"}
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
           <div className="absolute -right-6 -top-6 w-24 h-24 bg-cyan-50 rounded-full blur-xl pointer-events-none"></div>

          <h2 className="text-sm font-bold mb-3 text-cyan-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Quick Text Notes
          </h2>
          <form onSubmit={handleNotesUpload} className="space-y-3 relative z-10">
            <input
              type="text"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 placeholder:text-slate-400"
              placeholder="Title (e.g., Deadlock summary)"
              value={notesTitle}
              onChange={(e) => setNotesTitle(e.target.value)}
            />
            <textarea
              rows={3}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-slate-900 placeholder:text-slate-400"
              placeholder="Paste short notes here…"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
            <button
              type="submit"
              disabled={isUploading || !activeSessionId}
              className={`w-full text-xs font-bold rounded-xl px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${primaryGradientBtn}`}
            >
              {isUploading ? "Uploading…" : "Save Notes"}
            </button>
          </form>
        </div>

        {uploadStatus && (
          <div className={`text-xs font-bold p-3 rounded-xl border ${uploadStatus.includes('❌') ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            {uploadStatus}
          </div>
        )}

        <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Session</div>
          <div className="font-mono text-xs text-indigo-600 truncate">{activeSessionId || "None"}</div>
        </div>
      </div>
    </aside>
  );
}