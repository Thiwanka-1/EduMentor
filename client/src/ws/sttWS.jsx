//import { WS_BASE } from "../config/wsConfig.jsx";
export default function createSTTWS(onTranscription) {
 // const ws = new WebSocket(`${WS_BASE}/ws/stt`);
const ws = new WebSocket("ws://localhost:5001/ws/stt");

  ws.onopen = () => console.log("🎤 STT WebSocket Connected");
  ws.onerror = (e) => console.error("STT WS Error:", e);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "transcript") {
      onTranscription(data.text);
    }
  };

  return ws;
}
