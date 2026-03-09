// ws/tutorSocket.js
const llmService = require("../services/llmService");
const audioService = require("../services/audioService");
const sessionService = require("../services/sessionService");
const ragService = require("../services/ragService");

module.exports = function tutorSocket(ws) {
  let sessionId = sessionService.createSession();
  sessionService.setMode(sessionId, "tutor");

  ws.send(JSON.stringify({ type: "session", sessionId }));

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    const context = await ragService.search(data.question);

    const fullPrompt = `
You are a virtual teacher. Answer the question clearly.
Question: ${data.question}
Context from lecture slides:
${context}
`;

    const response = await llmService.generateStream(fullPrompt);
    audioService.generateAudioAndVisemes(response, ws);
  });
};
