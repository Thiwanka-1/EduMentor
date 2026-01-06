import { useEffect, useRef, useState } from "react";
import { WS_BASE } from "../api/wsConfig.jsx";
export default function useSTT(onFinalText) {
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);
  const wsRef = useRef(null);

  const [isListening, setListening] = useState(false);

  // Connect to STT WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/stt`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "transcript") {
        onFinalText(data.text);
        setListening(false);
      }
    };

    return () => ws.close();
  }, []);

  // Start recording
  async function startListening() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = recorder;
    audioChunks.current = [];

    recorder.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      const base64 = await convertToBase64(blob);

      wsRef.current.send(
        JSON.stringify({
          type: "audio_chunk",
          audio: base64,
        })
      );
    };

    recorder.start();
    setListening(true);
  }

  // Stop recording
  function stopListening() {
    mediaRecorderRef.current.stop();
  }

  // Convert Blob to Base64
  function convertToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });
  }

  return {
    isListening,
    startListening,
    stopListening,
  };
}
