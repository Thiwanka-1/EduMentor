export default function audioWSConnection(ws) {
  console.log("[AudioWS] Client connected.");

  ws.on("message", (data) => {
    console.log("[AudioWS] Incoming audio request:", data.toString());
  });

  ws.on("close", () => {
    console.log("[AudioWS] Client disconnected.");
  });
}
