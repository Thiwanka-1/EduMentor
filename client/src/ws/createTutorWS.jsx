//import { WS_BASE } from "../config/wsConfig.jsx";
export default function createTutorWS(onData) {
 // const ws = new WebSocket(`${WS_BASE}/ws/tutor`);
const ws = new WebSocket("ws://localhost:5001/ws/tutor");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onData(data);
  };

  return ws;
}
