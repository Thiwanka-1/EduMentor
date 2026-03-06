//import { WS_BASE } from "../config/wsConfig.jsx";
export default function createTutorWS(onMessage) {
  //const ws = new WebSocket(`${WS_BASE}/ws/tutor`);
  const ws = new WebSocket("ws://localhost:5001/ws/tutor");

  ws.onopen = () => console.log("Tutor WS Connected");
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (err) => console.error("Tutor WS Error:", err);

  return ws;
}
