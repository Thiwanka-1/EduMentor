import { useEffect, useRef, useState } from "react";
import useSTT from "../hooks/useSTT.jsx";
import AvatarScene from "../three/AvatarScene.jsx";
import { playVisemes } from "../utils/avatar/playVisemes.jsx";

export default function TutorMode() {
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const avatarRef = useRef(null);
  const audioRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");

  const WS_URL = "ws://localhost:5001/ws/tutor"; // keep yours

  // --------------------------------------------------------
  // 1) Generate Teacher Speech + Visemes (NEW)
  // --------------------------------------------------------
  async function speakTeacher(text) {
    try {
      setStatus("speaking");

      // IMPORTANT: your backend now returns audioUrl + visemes
      const API_BASE = "http://localhost:5001";

const res = await fetch(`${API_BASE}/api/talk`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text }),
});

      const json = await res.json();
      console.log("🔊 Talk Response:", json);

      if (!json.ok) throw new Error(json.error || "Talk failed");

      // 1) Play audio
      const audioUrl = API_BASE + json.audioUrl;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }

      // 2) Drive avatar visemes in real time
      const stop = playVisemes(json.visemes || [], {
        onViseme: (v) => avatarRef.current?.setViseme(v),
        onSilence: () => avatarRef.current?.setViseme("SIL"),
      });

      // 3) Reset when audio ends
      if (audioRef.current) {
        audioRef.current.onended = () => {
          stop?.();
          avatarRef.current?.setViseme("SIL");
          setStatus("idle");
        };
      }
    } catch (err) {
      console.error("❌ speakTeacher error:", err);
      avatarRef.current?.setViseme("SIL");
      setStatus("idle");
    }
  }

  // --------------------------------------------------------
  // 2) Send WebSocket Data
  // --------------------------------------------------------
  function sendWS(payload) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }

  // --------------------------------------------------------
  // 3) WebSocket Connection
  // --------------------------------------------------------
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => console.log("🔗 WS Connected");
    ws.onclose = () => console.log("❌ WS Closed");

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      console.log("📩 WS Message:", data);

      if (data.type === "status") {
        setStatus(data.value);
        return;
      }

      if (data.type === "text") {
        setMessages((prev) => [...prev, { sender: "ai", text: data.text }]);
        speakTeacher(data.text); // ✅ real-time avatar speaking
      }
    };

    return () => ws.close();
  }, []);

  // --------------------------------------------------------
  // 4) Speech-to-Text Hook
  // --------------------------------------------------------
  const { isListening, startListening, stopListening } = useSTT((text) => {
    setMessages((prev) => [...prev, { sender: "me", text }]);
    sendWS({ type: "ask", question: text });
  });

  // --------------------------------------------------------
  // 5) Send Text
  // --------------------------------------------------------
  function sendMessage() {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "me", text: input }]);
    sendWS({ type: "ask", question: input });
    setInput("");
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------------
  // 6) UI
  // --------------------------------------------------------
  return (
    <div className="h-screen w-screen flex bg-[#040b16] text-white">
      {/* LEFT — 3D Avatar */}
      <div className="w-[60%] flex flex-col items-center justify-center border-r border-white/10 p-4">
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-xl border border-white/10">
          <AvatarScene ref={avatarRef} url="/avatar.glb" />
        </div>

        {/* hidden audio player (or you can show controls) */}
        <audio ref={audioRef} hidden />
      </div>

      {/* RIGHT — Chat */}
      <div className="w-[40%] p-8 flex flex-col">
        <div className="flex justify-between mb-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Chat with Tutor 💬
          </h2>

          <span
            className={`
            px-3 py-1 rounded-full text-sm
            ${
              status === "thinking"
                ? "bg-yellow-600/20 text-yellow-300"
                : status === "speaking"
                ? "bg-green-600/20 text-green-300"
                : "bg-gray-600/20 text-gray-300"
            }
          `}
          >
            {status === "thinking" && "Thinking..."}
            {status === "speaking" && "Speaking..."}
            {status === "idle" && "Ready"}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white/5 p-4 rounded-xl space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.sender === "me" ? "text-right" : "text-left"}>
              <span
                className={`
                  inline-block px-4 py-2 rounded-xl text-sm
                  ${m.sender === "me" ? "bg-blue-600 text-white" : "bg-white/20 text-white"}
                `}
              >
                {m.text}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <div className="flex mt-4 gap-2">
          <input
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl"
          >
            Send
          </button>
        </div>

        {/* STT Button */}
        <div className="mt-3">
          {!isListening ? (
            <button
              onClick={startListening}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20"
            >
              🎤 Start Talking
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="w-full py-3 rounded-xl bg-red-500/50"
            >
              🔴 Listening...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}