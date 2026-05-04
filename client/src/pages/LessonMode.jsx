// src/pages/LessonMode.jsx
import { useEffect, useRef, useState } from "react";
import AvatarScene from "../three/AvatarScene.jsx";
import { playVisemes } from "../utils/avatar/playVisemes.jsx";

const API_BASE = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws/lesson";

export default function LessonMode() {
  const wsRef = useRef(null);
  const avatarRef = useRef(null);
  const audioRef = useRef(null);
  const stopVisemesRef = useRef(null);
  const outputEndRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState(null);
  const [teacherText, setTeacherText] = useState("");
  const [latestAudioUrl, setLatestAudioUrl] = useState(null); // Track audio for download

  // --------------------------
  // UI helpers
  // --------------------------
  function appendOutput(text) {
    setTeacherText((p) => (p ? p + "\n\n" : "") + (text || ""));
  }

  function clearOutput() {
    setTeacherText("");
  }

  function stopLocalPlayback() {
    stopVisemesRef.current?.();
    stopVisemesRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    avatarRef.current?.setViseme?.("SIL");
  }

  // --------------------------
  // Speak Teacher
  // --------------------------
  async function speakTeacher(text) {
    try {
      if (!text?.trim()) return;

      setStatus("speaking");

      const res = await fetch(`${API_BASE}/api/talk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const json = await res.json().catch(() => ({}));
      console.log("🔊 /api/talk:", json);

      if (!json.ok) throw new Error(json.error || "Talk failed");

      // stop anything currently playing
      stopLocalPlayback();

      // 1) Play audio (MP3 served from backend)
      const audioUrl = API_BASE + json.audioUrl;
      setLatestAudioUrl(audioUrl); // Save for download button

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.pause();
      audioRef.current.src = audioUrl;

      // 2) Drive visemes
      const stop = playVisemes(json.visemes || [], {
        onViseme: (v) => avatarRef.current?.setViseme?.(v),
        onSilence: () => avatarRef.current?.setViseme?.("SIL"),
      });
      stopVisemesRef.current = stop;

      // 3) Reset at end
      audioRef.current.onended = () => {
        stop?.();
        avatarRef.current?.setViseme?.("SIL");
        setStatus("idle");
      };

      await audioRef.current.play().catch(() => {
        appendOutput("⚠️ Audio autoplay blocked. Click any button once.");
        setStatus("idle");
      });
    } catch (err) {
      console.error("❌ speakTeacher error:", err);
      avatarRef.current?.setViseme?.("SIL");
      setStatus("idle");
      appendOutput(`❌ TTS error: ${err.message}`);
    }
  }

  // --------------------------
  // WebSocket helpers
  // --------------------------
  function safeSend(obj) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
    wsRef.current.send(JSON.stringify(obj));
    return true;
  }

  function connectWS(newDocId) {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🔗 WS Connected: /ws/lesson");
      setStatus("connected");
      ws.send(JSON.stringify({ type: "init", docId: newDocId }));
    };

    ws.onmessage = async (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (msg.type === "status") {
        setStatus(msg.value || msg.status || "idle");
        return;
      }

      if (msg.type === "text") {
        appendOutput(msg.text);
        await speakTeacher(msg.text);
        return;
      }

      if (msg.type === "audio") {
        console.warn("⚠️ Received WS audio event, ignoring.");
        return;
      }

      if (msg.type === "error") {
        appendOutput(`❌ ${msg.msg || msg.message || "Unknown error"}`);
      }
    };

    ws.onclose = () => {
      console.log("❌ WS Closed: /ws/lesson");
      setStatus("disconnected");
    };

    ws.onerror = () => setStatus("ws_error");
  }

  // --------------------------
  // Upload
  // --------------------------
  async function uploadDoc() {
    if (!file) return appendOutput("❌ Choose a file first.");

    try {
      setStatus("uploading");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_BASE}/slides/upload`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Upload failed");

      setDocId(json.docId);

      setTeacherText(
        `✅ Uploaded: ${json.filename}\nDocId: ${json.docId}\nChars: ${json.chars}\n\nPress Start to begin.`
      );

      connectWS(json.docId);
      setStatus("idle");
    } catch (e) {
      setStatus("idle");
      appendOutput(`❌ Upload error: ${e.message}`);
    }
  }

  // --------------------------
  // Commands
  // --------------------------
  function runCmd(cmd) {
    if (!docId) return appendOutput("❌ Upload a document first.");

    setStatus("thinking");
    const ok = safeSend({ type: "cmd", cmd });

    if (!ok) {
      setStatus("idle");
      appendOutput("❌ WS not connected yet. Try again in 1 second.");
    }
  }

  function stopTeaching() {
    stopLocalPlayback();
    safeSend({ type: "stop" });
    setStatus("idle");
    appendOutput("🛑 Stopped.");
  }

  // --------------------------
  // Downloads
  // --------------------------
  function downloadVoice() {
    if (!latestAudioUrl) return alert("No voice generated yet!");
    const a = document.createElement("a");
    a.href = latestAudioUrl;
    a.download = "lesson_audio.mp3";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadPDF() {
    if (!teacherText) return alert("No lesson text to download!");

    // Break the text down nicely into paragraphs
    const formattedText = teacherText
      .split('\n\n')
      .map(p => `<p style="margin-bottom: 16px; line-height: 1.6;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Lesson Breakdown</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 24px; }
            .content { background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>Lesson Breakdown Document</h1>
          <div class="content">
            ${formattedText}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Slight delay to allow CSS to apply before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  // scroll output
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [teacherText]);

  // cleanup
  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch (err) {
        MessageEvent(err)
      }
      stopLocalPlayback();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_20%_10%,rgba(99,102,241,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_80%_20%,rgba(20,184,166,0.14),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-5 lg:px-10 py-6 h-screen flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between rounded-3xl px-6 py-5 border border-slate-200/70 bg-white/70 backdrop-blur">
          {/* Left: Title */}
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
              Interactive Lesson
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Learn with a{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">
                futuristic AI mentor
              </span>
            </h1>
          </div>

          {/* Right: Colorful guidance */}
          <div className="max-w-md text-right">
            <p className="text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-indigo-600">
                Upload your lecture material
              </span>{" "}
              and guide how the AI mentor teaches.
              <br />
              <span className="text-teal-600 font-semibold">
                Speaks • Explains • Adapts
              </span>{" "}
              based on your learning stage.
            </p>
          </div>

          {/* Status */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition
                ${
                  status === "thinking"
                    ? "bg-violet-500/10 text-violet-600 ring-violet-500/30"
                    : status === "speaking"
                    ? "bg-teal-500/10 text-teal-600 ring-teal-500/30"
                    : "bg-slate-100 text-slate-600 ring-slate-200"
                }
              `}
            >
              {status === "thinking" && "Thinking…"}
              {status === "speaking" && "Speaking…"}
              {status === "idle" && "Ready"}
              {status === "uploading" && "Uploading…"}
            </span>

            {/* 🎧 Speaking wave */}
            {status === "speaking" && (
              <div className="flex items-center gap-1 pr-1">
                {[...Array(4)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-teal-500 animate-wave"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ✅ Back Button */}
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2
                       text-sm font-semibold border border-slate-200/70 bg-white/70 hover:bg-white transition"
          >
            ← Back
          </button>
        </div>

        {/* Main */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Avatar with status glow */}
          <div
            className={[
              "w-[52%] rounded-3xl overflow-hidden border backdrop-blur transition-all duration-300",
              status === "thinking"
                ? "border-violet-400/40 shadow-[0_0_60px_-20px_rgba(139,92,246,0.6)]"
                : status === "speaking"
                ? "border-teal-400/40 shadow-[0_0_60px_-20px_rgba(45,212,191,0.6)]"
                : "border-slate-200/70",
              "bg-white/70",
            ].join(" ")}
          >
            <AvatarScene ref={avatarRef} url="/avatar.glb" />
            <audio ref={audioRef} hidden />
          </div>

          {/* Right panel */}
          <div className="w-[68%] flex flex-col gap-4 min-h-0">
            {/* Output (bigger) */}
            <div className="flex-[2.2] min-h-0 rounded-3xl p-6 overflow-y-auto whitespace-pre-wrap border border-slate-200/70 bg-white/70 backdrop-blur">
              <div className="flex items-center mb-3">
                <p className="font-semibold text-sm">AI Mentor Response</p>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-[11px] text-slate-500">
                    DocId: {docId || "—"}
                  </span>
                  <button
                    onClick={clearOutput}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-slate-700">
                {teacherText || "Your AI mentor is ready to begin the lesson."}
              </div>
              <div ref={outputEndRef} />
            </div>

            {/* Upload */}
            <div className="rounded-3xl p-4 flex items-center gap-3 border border-slate-200/70 bg-white/70 backdrop-blur">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
              <button
                onClick={uploadDoc}
                className="ml-auto px-5 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white hover:opacity-90"
              >
                Upload & Prepare Lesson
              </button>
            </div>

            {/* Lesson Controls */}
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 mb-1">
                Lesson Controls
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Gbtn label="Start Teaching" onClick={() => runCmd("start")} />
                <Gbtn label="Stop Session" onClick={stopTeaching} danger />
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={downloadVoice}
                  disabled={!latestAudioUrl}
                  className={`py-2 rounded-2xl text-[13px] font-semibold transition ${
                    !latestAudioUrl
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border border-slate-200/70 bg-white/70 text-indigo-600 hover:bg-slate-50"
                  }`}
                >
                  🎵 Download Voice
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={!teacherText}
                  className={`py-2 rounded-2xl text-[13px] font-semibold transition ${
                    !teacherText
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border border-slate-200/70 bg-white/70 text-teal-600 hover:bg-slate-50"
                  }`}
                >
                  📄 Download PDF Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gbtn({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-2 py-2 rounded-2xl text-[13px] font-semibold transition",
        danger
          ? "bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100"
          : "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white hover:opacity-90",
      ].join(" ")}
    >
      {label}
    </button>
  );
}