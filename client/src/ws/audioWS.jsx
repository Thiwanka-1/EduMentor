import { WS_BASE } from "../config/wsConfig.jsx";

export default function createAudioWS(onAudioFrame) {
  const ws = new WebSocket(`${WS_BASE}/ws/audio`);

  ws.onopen = () => console.log("Audio WS Connected");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onAudioFrame(data);
  };

  ws.onerror = (err) => console.error("Audio WS Error:", err);

  return ws;
}
