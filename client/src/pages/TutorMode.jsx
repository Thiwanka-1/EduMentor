// src/pages/TutorMode.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import useSTT from "../hooks/useSTT.jsx"; // Removed since we replaced the microphone button
import AvatarScene from "../three/AvatarScene.jsx";
import { playVisemes } from "../utils/avatar/playVisemes.jsx";
import { ArrowLeft } from "lucide-react";

export default function TutorMode() {
  const nav = useNavigate();
  const { state } = useLocation();

  const explanation = state?.explanation || "";

  const wsRef = useRef(null);
  const avatarRef = useRef(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [latestAudioUrl, setLatestAudioUrl] = useState(null); // Track the latest audio for downloading

  const WS_URL = "ws://localhost:5000/ws/tutor";
  const API_BASE = "http://localhost:5000";
  
  // 🔊 Tutor speaking
  async function speakTeacher(text) {
    try {
      setStatus("speaking");

      const res = await fetch(`${API_BASE}/api/talk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error("TTS failed");

      const fullAudioUrl = API_BASE + json.audioUrl;
      setLatestAudioUrl(fullAudioUrl); // Save URL for the download button

      audioRef.current.src = fullAudioUrl;
      await audioRef.current.play();

      const stop = playVisemes(json.visemes || [], {
        onViseme: (v) => avatarRef.current?.setViseme(v),
        onSilence: () => avatarRef.current?.setViseme("SIL"),
      });

      audioRef.current.onended = () => {
        stop?.();
        avatarRef.current?.setViseme("SIL");
        setStatus("idle");
      };
    } catch {
      setStatus("idle");
    }
  }

  // 🔗 WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "text") {
        setMessages((m) => [...m, { sender: "ai", text: data.text }]);
        speakTeacher(data.text);
      }
    };

    return () => ws.close();
  }, []);

  // 🎓 Auto-start explanation
  useEffect(() => {
    if (!explanation) return;

    const intro = `Let me explain this step by step. ${explanation}`;
    setMessages([{ sender: "ai", text: intro }]);
    speakTeacher(intro);
  }, []);

  function sendMessage() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { sender: "me", text: input }]);
    wsRef.current?.send(JSON.stringify({ type: "ask", question: input }));
    setInput("");
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📥 Download Helpers
  function downloadVoice() {
    if (!latestAudioUrl) return alert("No voice generated yet!");
    const a = document.createElement("a");
    a.href = latestAudioUrl;
    a.download = "ai_tutor_voice.mp3";
    a.target = "_blank"; // Fallback to open in new tab if direct download is blocked
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadPDF() {
    if (messages.length === 0) return alert("Chat is empty!");
    
    // Create a clean HTML layout for the PDF
    const chatHtml = messages
      .map(
        (m) =>
          `<div style="margin-bottom: 12px; font-family: sans-serif;">
            <strong style="color: ${m.sender === "me" ? "#4f46e5" : "#0f766e"};">
              ${m.sender === "me" ? "You" : "AI Tutor"}:
            </strong> 
            <span style="color: #333;">${m.text}</span>
          </div>`
      )
      .join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Lesson Transcript</title>
        </head>
        <body style="padding: 40px; color: #1e293b;">
          <h2 style="font-family: sans-serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Interactive Lesson Transcript</h2>
          ${chatHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    // Use the browser's native print-to-pdf functionality
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_20%_10%,rgba(99,102,241,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_80%_20%,rgba(20,184,166,0.12),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-5 lg:px-10 py-6 h-screen flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between rounded-3xl px-6 py-5 border border-slate-200/70 bg-white/70 backdrop-blur">
          {/* Title */}
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
              Conversational Tutor
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Chat with a{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">
                futuristic AI Teacher
              </span>
            </h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block max-w-sm text-right">
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-indigo-600">
                  Ask follow-up questions
                </span>{" "}
                clarify doubts
                <br />
                <span className="text-teal-600 font-semibold">
                  explore concepts
                </span>{" "}
                interactively through voice or text.
              </p>
            </div>

            {/* Status */}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1
                ${
                  status === "speaking"
                    ? "bg-teal-500/10 text-teal-600 ring-teal-500/30"
                    : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
            >
              {status === "speaking" ? "Speaking…" : "Ready"}
            </span>

            {/* Back */}
            <button
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2
                         text-sm font-semibold
                         border border-slate-200/70 bg-white/70 hover:bg-white"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Avatar */}
          <div
            className={[
              "w-full lg:w-[50%] rounded-3xl overflow-hidden border backdrop-blur transition-all",
              status === "speaking"
                ? "border-teal-400/40 shadow-[0_0_60px_-20px_rgba(45,212,191,0.6)]"
                : "border-slate-200/70",
              "bg-white/70",
            ].join(" ")}
          >
            <AvatarScene ref={avatarRef} url="/avatar.glb" />
            <audio ref={audioRef} hidden />

            {/* Progress bar */}
            <div className="h-1 bg-slate-200">
              <div
                className={`h-full transition-all duration-500
                  ${
                    status === "speaking"
                      ? "w-3/4 bg-gradient-to-r from-indigo-600 to-teal-500"
                      : "w-1/4 bg-slate-400"
                  }`}
              />
            </div>
          </div>

          {/* Chat */}
          <div className="w-full lg:w-[40%] flex flex-col gap-3 min-h-0">
            {/* Chat actions */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
                Conversation
              </p>

              <div className="flex items-center gap-2">
                {/* Clear */}
                <button
                  onClick={() => setMessages([])}
                  disabled={status === "speaking"}
                  className={`
                    px-4 py-2 rounded-2xl text-sm font-semibold transition
                    ${
                      status === "speaking"
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white hover:opacity-90"
                    }
                  `}
                >
                  Clear
                </button>

                {/* Stop */}
                <button
                  onClick={() => {
                    audioRef.current?.pause();
                    setStatus("idle");
                  }}
                  className={`
                  px-4 py-2 rounded-2xl text-sm font-semibold transition
                  ${
                    status === "speaking"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.45)]"
                      : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90"
                  }
                `}
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-[2.6] overflow-y-auto rounded-3xl p-5 space-y-3 border border-slate-200/70 bg-white/70 backdrop-blur">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.sender === "me" ? "text-right" : "text-left"}
                >
                  <span
                    className={`inline-block px-4 py-2 rounded-2xl text-[13px]
                      ${
                        m.sender === "me"
                          ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                disabled={status === "speaking"}
                className={`flex-1 px-4 py-2.5 rounded-2xl text-sm
                  border
                  ${
                    status === "speaking"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                      : "border-slate-200/70 bg-white/70"
                  }`}
                placeholder="Ask a follow-up question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={status === "speaking"}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold
                  ${
                    status === "speaking"
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white hover:opacity-90"
                  }`}
              >
                Send
              </button>
            </div>

            {/* DOWNLOAD BUTTONS (Replaced Voice Button) */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={downloadVoice}
                disabled={!latestAudioUrl}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition
                  ${
                    !latestAudioUrl
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border border-slate-200/70 bg-white/70 text-indigo-600 hover:bg-slate-50"
                  }`}
              >
                🎵 Download Voice
              </button>
              
              <button
                onClick={downloadPDF}
                disabled={messages.length === 0}
                className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition
                  ${
                    messages.length === 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border border-slate-200/70 bg-white/70 text-teal-600 hover:bg-slate-50"
                  }`}
              >
                📄 Download PDF
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}