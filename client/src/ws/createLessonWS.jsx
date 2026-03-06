import { WS_BASE } from "../config/wsConfig.jsx";
export default function createLessonWS(onData) {
 
    const ws = new WebSocket(`${WS_BASE}/ws/lesson`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onData(data);
    } catch  {
      console.error("Invalid WS data:", event.data);
    }
  };

  ws.onerror = (err) => {
    console.error("Lesson WS Error:", err);
  };

  return ws;
}
