import { useEffect, useRef, useState } from "react";
import AvatarScene from "../three/AvatarScene.jsx";
import { playVisemes } from "../utils/avatar/playVisemes.jsx";
import useSTT from "../hooks/useSTT.jsx";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws/lesson";

const LANGUAGE_MODES = ["english", "sinhala", "tamil"];

const MODE_FEATURES = {
  english: {
    showAvatar: true,
    autoSpeak: true,
    showListenButton: false,
    enableMic: true,
    label: "English avatar voice learning mode",
  },
  tamil: {
    showAvatar: true,
    autoSpeak: true,
    showListenButton: false,
    enableMic: true,
    label: "Tamil avatar voice learning mode",
  },
  sinhala: {
    showAvatar: false,
    autoSpeak: false,
    showListenButton: true,
    enableMic: false,
    label: "Sinhala chat learning mode with optional listen",
  },
};

function getModeFeatures(mode = "english") {
  return MODE_FEATURES[mode] || MODE_FEATURES.english;
}

export default function LessonMode() {
  const nav = useNavigate();
  const location = useLocation();

  const explanation = location.state?.explanation || "";
  const resumeSessionId = location.state?.sessionId || "";

  const wsRef = useRef(null);
  const avatarRef = useRef(null);
  const audioRef = useRef(null);
  const stopVisemesRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sessionIdRef = useRef(resumeSessionId || null);
  const browserMouthTimerRef = useRef(null);
  const mouthKeepAliveRef = useRef(null);
  const languageModeRef = useRef("english");

  const [status, setStatus] = useState("idle");
  const [sttStatus, setSttStatus] = useState("");
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState(null);
  const [latestAudioUrl, setLatestAudioUrl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [sessionId, setSessionId] = useState(resumeSessionId || null);
  const [languageMode, setLanguageMode] = useState("english");

  const features = getModeFeatures(languageMode);

  function setActiveSessionId(id) {
    if (!id) return;
    sessionIdRef.current = id;
    setSessionId(id);
  }

  function appendAiMessage(text) {
    if (!text?.trim()) return;
    setMessages((prev) => [...prev, { sender: "ai", text }]);
  }

  function appendUserMessage(text) {
    if (!text?.trim()) return;
    setMessages((prev) => [...prev, { sender: "me", text }]);
  }

  function clearConversation() {
    setMessages([]);
  }

  function getSTTLanguage(mode = languageMode) {
    if (mode === "tamil") return "ta-IN";
    return "en-US";
  }

  function getBrowserSpeechLang(mode = languageMode) {
    if (mode === "sinhala") return "si-LK";
    if (mode === "tamil") return "ta-IN";
    return "en-US";
  }

  function getBrowserVoice(mode = languageMode) {
    if (!window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices?.() || [];
    const lang = getBrowserSpeechLang(mode);

    return (
      voices.find((voice) => voice.lang === lang) ||
      voices.find((voice) => voice.lang?.startsWith(lang.split("-")[0])) ||
      voices.find((voice) => voice.lang?.startsWith("en")) ||
      null
    );
  }

  function startBrowserMouthLoop() {
    clearBrowserMouthLoop();

    const sequence = ["AA", "EE", "MBP", "OH", "AA", "SS", "OO"];
    let index = 0;

    browserMouthTimerRef.current = window.setInterval(() => {
      avatarRef.current?.setViseme?.(sequence[index % sequence.length]);
      index += 1;
    }, 130);
  }

  function clearBrowserMouthLoop() {
    if (browserMouthTimerRef.current) {
      window.clearInterval(browserMouthTimerRef.current);
      browserMouthTimerRef.current = null;
    }
  }

  function clearMouthKeepAlive() {
    if (mouthKeepAliveRef.current) {
      mouthKeepAliveRef.current();
      mouthKeepAliveRef.current = null;
    }
  }

  function speakWithBrowser(text) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text?.trim()) {
        clearBrowserMouthLoop();
        avatarRef.current?.setViseme?.("SIL");
        setStatus("idle");
        resolve(false);
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const currentLanguageMode = languageModeRef.current || languageMode;
        const currentFeatures = getModeFeatures(currentLanguageMode);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getBrowserSpeechLang(currentLanguageMode);
        utterance.voice = getBrowserVoice(currentLanguageMode);
        utterance.rate =
          currentLanguageMode === "sinhala" || currentLanguageMode === "tamil"
            ? 0.9
            : 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          setStatus("speaking");

          if (currentFeatures.showAvatar) {
            startBrowserMouthLoop();
          }
        };

        utterance.onend = () => {
          clearBrowserMouthLoop();
          avatarRef.current?.setViseme?.("SIL");
          setStatus("idle");
          resolve(true);
        };

        utterance.onerror = (event) => {
          console.error("Browser speech error:", event);
          clearBrowserMouthLoop();
          avatarRef.current?.setViseme?.("SIL");
          setStatus("idle");
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Browser speech error:", err);
        clearBrowserMouthLoop();
        avatarRef.current?.setViseme?.("SIL");
        setStatus("idle");
        resolve(false);
      }
    });
  }

  function stopLocalPlayback() {
    try {
      window.speechSynthesis?.cancel?.();
      clearBrowserMouthLoop();
      clearMouthKeepAlive();

      stopVisemesRef.current?.();
      stopVisemesRef.current = null;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }

      avatarRef.current?.setViseme?.("SIL");
    } catch (err) {
      console.error("stopLocalPlayback error:", err);
    }
  }

  function waitForAudioMetadata(audioEl) {
    return new Promise((resolve) => {
      if (!audioEl) {
        resolve(0);
        return;
      }

      if (audioEl.duration && !Number.isNaN(audioEl.duration)) {
        resolve(audioEl.duration);
        return;
      }

      let doneCalled = false;

      const done = () => {
        if (doneCalled) return;
        doneCalled = true;
        cleanup();

        const duration =
          audioEl.duration && !Number.isNaN(audioEl.duration)
            ? audioEl.duration
            : 0;

        resolve(duration);
      };

      const cleanup = () => {
        audioEl.removeEventListener("loadedmetadata", done);
        audioEl.removeEventListener("canplaythrough", done);
        audioEl.removeEventListener("durationchange", done);
        audioEl.removeEventListener("error", done);
      };

      audioEl.addEventListener("loadedmetadata", done);
      audioEl.addEventListener("canplaythrough", done);
      audioEl.addEventListener("durationchange", done);
      audioEl.addEventListener("error", done);

      setTimeout(done, 1800);
    });
  }

  function syncVisemesToAudioDuration(visemes = [], audioDurationSec = 0) {
    if (!Array.isArray(visemes) || visemes.length === 0) {
      return [{ t: 0, v: "SIL" }];
    }

    if (
      !audioDurationSec ||
      Number.isNaN(audioDurationSec) ||
      audioDurationSec <= 0
    ) {
      return visemes;
    }

    const lastTime = Math.max(...visemes.map((item) => Number(item.t) || 0));

    if (!lastTime || lastTime <= 0) {
      return visemes;
    }

    const targetDuration = Math.max(0.8, audioDurationSec);
    const scale = targetDuration / lastTime;

    const synced = visemes.map((item) => ({
      ...item,
      t: Number(((Number(item.t) || 0) * scale).toFixed(3)),
    }));

    const last = synced[synced.length - 1];

    if (!last || last.v !== "SIL" || last.t < targetDuration - 0.05) {
      synced.push({
        t: Number(targetDuration.toFixed(3)),
        v: "SIL",
      });
    }

    return synced;
  }

  function keepMouthAliveDuringLongAudio(audioEl) {
    const sequence = ["AA", "EE", "OH", "MBP", "SS", "OO"];
    let index = 0;

    const intervalId = window.setInterval(() => {
      if (!audioEl || audioEl.paused || audioEl.ended) {
        window.clearInterval(intervalId);
        return;
      }

      avatarRef.current?.setViseme?.(sequence[index % sequence.length]);
      index += 1;

      setTimeout(() => {
        if (!audioEl.paused && !audioEl.ended) {
          avatarRef.current?.setViseme?.("AA");
        }
      }, 70);
    }, 850);

    return () => window.clearInterval(intervalId);
  }

  async function saveAudioToSession(
    audioUrl,
    activeSessionId = sessionIdRef.current
  ) {
    try {
      if (!audioUrl || !activeSessionId) return;

      const res = await fetch(
        `${API_BASE}/api/lessons/sessions/${activeSessionId}/media`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ audioUrl }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to save audio.");
      }
    } catch (err) {
      console.error("saveAudioToSession error:", err);
    }
  }

  async function speakTeacher(text, activeSessionId = sessionIdRef.current) {
    try {
      if (!text?.trim()) return;

      const currentLanguageMode = languageModeRef.current || languageMode;
      const currentFeatures = getModeFeatures(currentLanguageMode);

      setStatus("speaking");

      const res = await fetch(`${API_BASE}/api/talk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: currentLanguageMode,
          languageMode: currentLanguageMode,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        console.warn("Backend TTS failed. Using browser speech fallback:", json);

        appendAiMessage(
          "⚠️ Online voice generation failed, so I’m using browser voice for now."
        );

        await speakWithBrowser(text);
        return;
      }

      stopLocalPlayback();

      const audioUrl = json.audioUrl?.startsWith("http")
        ? json.audioUrl
        : API_BASE + json.audioUrl;

      setLatestAudioUrl(audioUrl);

      await saveAudioToSession(audioUrl, activeSessionId);

      if (!audioRef.current) {
        setStatus("idle");
        return;
      }

      const audioEl = audioRef.current;

      audioEl.src = audioUrl;
      audioEl.load();

      const realAudioDuration = await waitForAudioMetadata(audioEl);

      const syncedVisemes = syncVisemesToAudioDuration(
        json.visemes || [],
        realAudioDuration
      );

      audioEl.onended = () => {
        stopVisemesRef.current?.();
        stopVisemesRef.current = null;

        clearMouthKeepAlive();

        avatarRef.current?.setViseme?.("SIL");
        setStatus("idle");
      };

      audioEl.onerror = async () => {
        stopVisemesRef.current?.();
        stopVisemesRef.current = null;

        clearMouthKeepAlive();

        avatarRef.current?.setViseme?.("SIL");

        console.warn("Audio element failed. Using browser speech fallback.");
        await speakWithBrowser(text);
      };

      await audioEl.play();

      if (currentFeatures.showAvatar) {
        const stop = playVisemes(syncedVisemes, {
          onViseme: (v) => avatarRef.current?.setViseme?.(v),
          onSilence: () => avatarRef.current?.setViseme?.("SIL"),
        });

        stopVisemesRef.current = stop;
        mouthKeepAliveRef.current = keepMouthAliveDuringLongAudio(audioEl);
      }
    } catch (err) {
      console.error("speakTeacher error:", err);

      stopLocalPlayback();

      appendAiMessage(
        "⚠️ Audio service failed, so I’m using browser voice for this reply."
      );

      await speakWithBrowser(text);
    }
  }

  async function sendMessage(customText) {
    const userText = (typeof customText === "string" ? customText : input).trim();
    if (!userText) return;

    const currentLanguageMode = languageModeRef.current || languageMode;
    const currentFeatures = getModeFeatures(currentLanguageMode);

    const recentClientMessages = messages.slice(-10).map((m) => ({
      role: m.sender === "me" ? "user" : "tutor",
      text: m.text || "",
      languageMode: currentLanguageMode,
    }));

    appendUserMessage(userText);
    setInput("");
    setStatus("thinking");

    try {
      const res = await fetch(`${API_BASE}/api/lessons/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          topic: docId ? file?.name || "Uploaded document lesson" : userText,
          message: userText,
          docId,
          languageMode: currentLanguageMode,
          sourceType: "text",
          clientMessages: recentClientMessages,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to sync message");
      }

      const activeSessionId = data.sessionId || sessionIdRef.current;

      if (activeSessionId) {
        setActiveSessionId(activeSessionId);
      }

      appendAiMessage(data.reply);

      if (currentFeatures.autoSpeak) {
        await speakTeacher(data.reply, activeSessionId);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setStatus("idle");
      appendAiMessage("❌ Error connecting to lesson server.");
    }
  }

  function safeSend(obj) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    wsRef.current.send(JSON.stringify(obj));
    return true;
  }

  function connectWS(newDocId, selectedLanguageMode = languageModeRef.current) {
    try {
      if (wsRef.current) wsRef.current.close();

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");

        ws.send(
          JSON.stringify({
            type: "init",
            docId: newDocId,
            sessionId: sessionIdRef.current,
            languageMode: selectedLanguageMode || "english",
          })
        );
      };

      ws.onmessage = async (ev) => {
        let msg;

        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        const currentLanguageMode = languageModeRef.current || languageMode;
        const currentFeatures = getModeFeatures(currentLanguageMode);

        if (msg.type === "status") {
          const nextStatus = msg.value || msg.status || "idle";

          if (!currentFeatures.autoSpeak && nextStatus === "speaking") {
            setStatus("idle");
          } else {
            setStatus(nextStatus);
          }

          return;
        }

        if (msg.type === "text") {
          const aiText = msg.text || "";
          const activeSessionId = msg.sessionId || sessionIdRef.current;

          appendAiMessage(aiText);

          if (currentFeatures.autoSpeak) {
            await speakTeacher(aiText, activeSessionId);
          } else {
            setStatus("idle");
          }

          return;
        }

        if (msg.type === "error") {
          appendAiMessage(`❌ ${msg.msg || msg.message || "Unknown error"}`);
          setStatus("idle");
        }
      };

      ws.onclose = () => setStatus("disconnected");
      ws.onerror = () => setStatus("ws_error");
    } catch (err) {
      console.error("connectWS error:", err);
      setStatus("ws_error");
    }
  }

  async function uploadDoc(selectedFile = file) {
    if (!selectedFile) {
      appendAiMessage("❌ Choose a file first.");
      return;
    }

    try {
      setStatus("uploading");

      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await fetch(`${API_BASE}/slides/upload`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Upload failed");
      }

      setDocId(json.docId);

      appendAiMessage(
        `✅ Uploaded: ${json.filename}\n\nYour lesson is ready. Press Start or ask a question.`
      );

      connectWS(json.docId, languageModeRef.current || languageMode);
      setStatus("idle");
    } catch (err) {
      setStatus("idle");
      appendAiMessage(`❌ Upload error: ${err.message}`);
    }
  }

  function runCmd(cmd) {
    if (!docId) {
      appendAiMessage("❌ Upload a document first.");
      return;
    }

    const currentLanguageMode = languageModeRef.current || languageMode;

    setStatus("thinking");

    const ok = safeSend({
      type: "cmd",
      cmd,
      docId,
      sessionId: sessionIdRef.current,
      languageMode: currentLanguageMode,
    });

    if (!ok) {
      setStatus("idle");
      appendAiMessage("❌ WebSocket is not connected yet.");
    }
  }

  function stopTeaching() {
    stopLocalPlayback();
    stopListening?.();

    safeSend({
      type: "stop",
      docId,
      sessionId: sessionIdRef.current,
      languageMode: languageModeRef.current || languageMode,
    });

    setStatus("idle");
  }

  function handleLanguageChange(mode) {
    
    if (!LANGUAGE_MODES.includes(mode)) return;

    languageModeRef.current = mode;
    setLanguageMode(mode);
    setInput("");

    stopListening?.();
    stopLocalPlayback();

    // Reset stuck Tamil/English speaking/thinking state.
    setStatus("idle");

    if (docId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "init",
          docId,
          sessionId: sessionIdRef.current,
          languageMode: mode,
        })
      );
    }
  }

  const { isListening, startListening, stopListening } = useSTT({
    language: getSTTLanguage(languageMode),

    onInterimText: (liveText) => {
      setInput(liveText || "");
    },

    onFinalText: (text) => {
      const spokenText = text?.trim();

      if (!spokenText) {
        setInput("");
        return;
      }

      setInput(spokenText);

      setTimeout(() => {
        sendMessage(spokenText);
      }, 200);
    },

    onStatusChange: (state) => {
      setSttStatus(state);

      if (state === "no-speech") {
        setInput("");
        appendAiMessage(
          "⚠️ I couldn’t hear anything. Please speak a little closer to the microphone and try again."
        );
      }

      if (state === "permission-denied") {
        setInput("");
        appendAiMessage(
          "❌ Microphone permission is blocked. Please allow microphone access in your browser."
        );
      }

      if (state === "language-not-supported") {
        setInput("");
        appendAiMessage(
          "⚠️ This browser may not support speech recognition for the selected language. Try Chrome/Edge or switch to English."
        );
      }

      if (state === "unsupported") {
        appendAiMessage(
          "❌ Speech recognition is not supported in this browser. Please use Chrome or Edge."
        );
      }
    },
  });

  function handleMicClick() {
    const currentFeatures = getModeFeatures(languageMode);

    if (status === "speaking" || !currentFeatures.enableMic) return;

    if (isListening) {
      stopListening();
      return;
    }

    setInput("");
    setSttStatus("starting");
    startListening();
  }

  function triggerFilePick() {
    document.getElementById("lesson-file-input")?.click();
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;
    setFile(selectedFile);
  }

  async function uploadSelectedFile() {
    if (!file) {
      appendAiMessage("❌ Choose a file first.");
      return;
    }

    stopLocalPlayback();
    setStatus("idle");

    await uploadDoc(file);
  }

  function removeSelectedFile() {
    setFile(null);

    const inputEl = document.getElementById("lesson-file-input");
    if (inputEl) inputEl.value = "";
  }

  function downloadVoice() {
    if (!latestAudioUrl) return;

    const a = document.createElement("a");
    a.href = latestAudioUrl;
    a.download = "lesson_audio.mp3";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function loadExistingSession(id) {
    try {
      if (!id) return;

      setStatus("loading");

      const res = await fetch(`${API_BASE}/api/lessons/sessions/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to load lesson session.");
      }

      const session = data.session;

      setActiveSessionId(session._id);
      setDocId(session.docId || null);

      const loadedLanguageMode = LANGUAGE_MODES.includes(session.languageMode)
        ? session.languageMode
        : "english";

      languageModeRef.current = loadedLanguageMode;
      setLanguageMode(loadedLanguageMode);

      setLatestAudioUrl(session.audioUrl || null);

      const loadedMessages = (session.messages || [])
        .filter((m) => m.role === "user" || m.role === "tutor")
        .map((m) => ({
          sender: m.role === "user" ? "me" : "ai",
          text: m.text || "",
        }));

      setMessages(loadedMessages);

      setStatus("idle");
    } catch (err) {
      console.error("loadExistingSession error:", err);
      setStatus("idle");
      appendAiMessage(`❌ Failed to resume lesson: ${err.message}`);
    }
  }

  function downloadPDF() {
    const aiMessages = messages.filter((m) => m.sender === "ai");

    if (!aiMessages.length) return;

    function escapeHtml(value = "") {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function formatNoteText(text = "") {
      const safe = escapeHtml(text);

      return safe
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/gim, "<em>$1</em>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br/>");
    }

    const dateText = new Date().toLocaleString();

    const notesHtml = aiMessages
      .map((m, index) => {
        return `
          <section class="note-card">
            <div class="note-label">Tutor Note ${index + 1}</div>
            <p>${formatNoteText(m.text)}</p>
          </section>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>EduMentor Lesson Notes</title>
          <style>
            @page {
              margin: 18mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family: Inter, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
            }

            .cover {
              border-radius: 24px;
              padding: 28px;
              background: linear-gradient(135deg, #4f46e5, #7c3aed, #14b8a6);
              color: white;
              margin-bottom: 24px;
            }

            .brand {
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.18em;
              font-weight: 800;
              opacity: 0.9;
              margin-bottom: 12px;
            }

            .title {
              font-size: 32px;
              line-height: 1.15;
              font-weight: 900;
              margin: 0 0 12px;
            }

            .meta {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 18px;
            }

            .pill {
              border: 1px solid rgba(255,255,255,0.35);
              background: rgba(255,255,255,0.16);
              border-radius: 999px;
              padding: 8px 12px;
              font-size: 12px;
              font-weight: 700;
            }

            .summary-box {
              border: 1px solid #dbeafe;
              background: #eff6ff;
              border-radius: 18px;
              padding: 18px 20px;
              margin-bottom: 18px;
            }

            .summary-title {
              color: #1d4ed8;
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin-bottom: 8px;
            }

            .summary-box p {
              margin: 0;
              color: #334155;
              line-height: 1.65;
              font-size: 14px;
            }

            .note-card {
              page-break-inside: avoid;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              background: #f8fafc;
              padding: 20px;
              margin-bottom: 16px;
              box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
            }

            .note-label {
              display: inline-flex;
              margin-bottom: 10px;
              border-radius: 999px;
              background: #eef2ff;
              color: #4f46e5;
              padding: 6px 10px;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.12em;
            }

            .note-card p {
              margin: 0;
              line-height: 1.75;
              font-size: 14px;
              color: #1e293b;
            }

            h1, h2, h3 {
              color: #312e81;
              margin: 16px 0 8px;
              line-height: 1.3;
            }

            h1 {
              font-size: 22px;
            }

            h2 {
              font-size: 18px;
            }

            h3 {
              font-size: 16px;
            }

            strong {
              color: #111827;
              font-weight: 900;
            }

            em {
              color: #475569;
            }

            .footer {
              margin-top: 28px;
              padding-top: 14px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 11px;
              text-align: center;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }

              .note-card {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="cover">
            <div class="brand">EduMentor AI</div>
            <h1 class="title">Lesson Notes</h1>
            <div class="meta">
              <div class="pill">Generated: ${escapeHtml(dateText)}</div>
              <div class="pill">Language: ${escapeHtml(languageMode.toUpperCase())}</div>
              <div class="pill">Notes: ${aiMessages.length}</div>
            </div>
          </div>

          <div class="summary-box">
            <div class="summary-title">Study Tip</div>
            <p>Review these notes once today, then ask your AI Mentor follow-up questions about the parts that are unclear.</p>
          </div>

          ${notesHtml}

          <div class="footer">
            Generated by EduMentor AI Tutor
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    languageModeRef.current = languageMode;
  }, [languageMode]);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    if (resumeSessionId) {
      loadExistingSession(resumeSessionId);
      return;
    }

    if (!explanation) return;

    sendMessage(`Explain this to me: ${explanation}`);
  }, []); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch (e) {
        console.error("WebSocket cleanup error:", e);
      }

      try {
        stopListening?.();
      } catch (e) {
        console.error("STT cleanup error:", e);
      }

      stopLocalPlayback();
    };
  }, []); // eslint-disable-line

  const statusText =
    status === "thinking"
      ? "Thinking"
      : status === "speaking"
      ? "Speaking"
      : status === "uploading"
      ? "Uploading"
      : status === "loading"
      ? "Loading"
      : status === "connected"
      ? "Connected"
      : status === "disconnected"
      ? "Disconnected"
      : status === "ws_error"
      ? "Error"
      : "Ready";

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900">
      <audio ref={audioRef} hidden />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(700px_360px_at_15%_0%,rgba(99,102,241,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_360px_at_100%_0%,rgba(20,184,166,0.05),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-4 rounded-[20px] border border-slate-300 bg-slate-100/90 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Learn with your AI Mentor
              </h1>

              <p className="mt-1 text-xs font-medium text-slate-600">
                {features.label}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGE_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleLanguageChange(mode)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      languageMode === mode
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                {statusText}
              </span>

              <button
                onClick={() => nav("/dashboard")}
                className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95"
              >
                My Lessons
              </button>

              <button
                onClick={() => nav(-1)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        <div
          className={`grid h-[calc(100vh-140px)] min-h-0 gap-4 ${
            features.showAvatar ? "grid-cols-12" : "grid-cols-1"
          }`}
        >
          {features.showAvatar && (
            <div className="sticky top-4 col-span-5 flex h-fit flex-col rounded-[20px] border border-slate-300 bg-slate-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Avatar Mentor
                  </h2>

                  <p className="text-xs text-slate-600">
                    Interactive visual tutor
                  </p>
                </div>

                {status === "speaking" && (
                  <div className="flex items-center gap-1">
                    {[...Array(4)].map((_, i) => (
                      <span
                        key={i}
                        className="h-4 w-1 animate-wave rounded-full bg-teal-500"
                        style={{ animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative h-[450px] overflow-hidden rounded-b-[20px] bg-slate-200">
                <AvatarScene ref={avatarRef} url="/avatar.glb" />
              </div>
            </div>
          )}

          <div
            className={`flex h-full min-h-0 flex-col gap-3 ${
              features.showAvatar ? "col-span-7" : "col-span-1"
            }`}
          >
            <div className="shrink-0 rounded-[16px] border border-slate-300 bg-slate-100 p-3 shadow-sm">
              <div className="mb-2">
                <h3 className="text-xs font-semibold text-slate-900">
                  Lesson Controls
                </h3>

                <p className="text-[11px] text-slate-600">
                  {docId ? "Document ready" : "No document uploaded yet"}
                </p>
              </div>

              {!features.showAvatar && (
                <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                  Sinhala mode is optimized for readable chat lessons. Use the
                  Listen button under tutor messages if you want audio.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <ActionBtn
                  label="Start"
                  icon={<PlayIcon />}
                  onClick={() => runCmd("start")}
                  variant="primary"
                />

                <ActionBtn
                  label="Stop"
                  icon={<StopIcon />}
                  onClick={stopTeaching}
                  variant="danger"
                />

                <ActionBtn
                  label="Voice"
                  icon={<AudioIcon />}
                  onClick={downloadVoice}
                  disabled={!latestAudioUrl}
                />

                <ActionBtn
                  label="Notes"
                  icon={<NoteIcon />}
                  onClick={downloadPDF}
                  disabled={!messages.some((m) => m.sender === "ai")}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-slate-300 bg-slate-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Conversation
                  </h3>

                  <p className="text-xs text-slate-600">
                    {docId
                      ? "Ask questions about your lesson"
                      : "Attach and upload a file to begin"}
                  </p>
                </div>

                <button
                  onClick={clearConversation}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Clear
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-scroll overscroll-contain px-4 py-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#94a3b8_#e2e8f0] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-200/70 px-6 text-center">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Your lesson conversation will appear here
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Attach a file, upload it, then start your session.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          m.sender === "me" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`${
  languageMode === "sinhala" ? "max-w-[96%]" : "max-w-[82%]"
} whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                            m.sender === "me"
                              ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white"
                              : "border border-slate-300 bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div>{m.text}</div>

                          {m.sender === "ai" && features.showListenButton && (
                            <button
                              type="button"
                              onClick={() =>
                                speakTeacher(m.text, sessionIdRef.current)
                              }
                              disabled={status === "speaking"}
                              className={`mt-2 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                                status === "speaking"
                                  ? "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400"
                                  : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              }`}
                            >
                              Listen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 p-3">
                {file && (
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileIcon />

                      <span className="truncate text-xs font-medium text-slate-700">
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={uploadSelectedFile}
                        disabled={status === "uploading"}
                        className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white transition ${
                          status === "uploading"
                            ? "cursor-wait bg-slate-400"
                            : "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 hover:opacity-95"
                        }`}
                      >
                        {status === "uploading" ? "Uploading..." : "Upload"}
                      </button>

                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                        title="Remove file"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="lesson-file-input"
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={triggerFilePick}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200"
                    title="Attach file"
                  >
                    <AttachIcon />
                  </button>

                  <input
                    disabled={status === "speaking"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask a question..."
                    className={`flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition ${
                      status === "speaking"
                        ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400"
                        : "border-slate-300 bg-slate-50 text-slate-700 focus:border-indigo-400 focus:bg-white"
                    }`}
                  />

                  {features.enableMic && (
                    <button
                      type="button"
                      onClick={handleMicClick}
                      disabled={status === "speaking"}
                      title={
                        isListening ? "Stop listening" : "Start voice input"
                      }
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                        status === "speaking"
                          ? "cursor-not-allowed bg-slate-200 text-slate-400"
                          : isListening
                          ? "bg-red-50 text-red-600 ring-1 ring-red-300"
                          : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <MicIcon />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={status === "speaking"}
                    className={`inline-flex h-9 items-center rounded-xl px-4 text-sm font-semibold transition ${
                      status === "speaking"
                        ? "cursor-not-allowed bg-slate-300 text-slate-500"
                        : "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white hover:opacity-95"
                    }`}
                  >
                    Send
                  </button>
                </div>

                {features.enableMic &&
                  (isListening ||
                    sttStatus === "no-speech" ||
                    sttStatus === "permission-denied") &&
                  status !== "speaking" && (
                    <div
                      className={`mt-2 flex items-center gap-2 text-xs ${
                        sttStatus === "permission-denied"
                          ? "text-red-600"
                          : sttStatus === "no-speech"
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          sttStatus === "permission-denied"
                            ? "bg-red-500"
                            : sttStatus === "no-speech"
                            ? "bg-amber-500"
                            : "animate-pulse bg-red-500"
                        }`}
                      />

                      {isListening &&
                        "Listening... Speak and pause to send automatically."}

                      {!isListening &&
                        sttStatus === "no-speech" &&
                        "No speech detected. Try again."}

                      {!isListening &&
                        sttStatus === "permission-denied" &&
                        "Microphone permission denied."}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Icons */

function ActionBtn({
  label,
  icon,
  onClick,
  disabled = false,
  variant = "default",
}) {
  const base =
    "inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition";

  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 text-white hover:opacity-95"
      : variant === "danger"
      ? "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
      : disabled
      ? "cursor-not-allowed bg-slate-200 text-slate-400"
      : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-200";

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AttachIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.82l8.49-8.48" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-indigo-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5.14v13.72c0 .8.87 1.28 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}