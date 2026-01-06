import { WS_BASE } from "../config/wsConfig.jsx";
export default function createLessonWS(onMessage) {
  //const ws = new WebSocket(`${WS_BASE}/ws/lesson`);
const ws = new WebSocket("ws://localhost:5001/ws/lesson");

  ws.onopen = () => console.log("Lesson WS Connected");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (err) => console.error("Lesson WS Error:", err);

  return ws;
}
