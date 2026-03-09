// ws/lessonSocket.js
const lessonService = require("../services/lessonService");
const audioService = require("../services/audioService");
const sessionService = require("../services/sessionService");

module.exports = function lessonSocket(ws) {
  let sessionId = sessionService.createSession();
  sessionService.setMode(sessionId, "lesson");

  ws.send(JSON.stringify({ type: "session", sessionId }));

  ws.on("message", async (msg) => {
    const data = JSON.parse(msg);

    if (data.action === "start") {
      const textResponse = await lessonService.startLesson(
        sessionId,
        data.topic
      );
      audioService.generateAudioAndVisemes(textResponse, ws);
    }

    if (data.action === "next") {
      const textResponse = await lessonService.nextStep(sessionId);
      audioService.generateAudioAndVisemes(textResponse, ws);
    }

    if (data.action === "repeat") {
      const textResponse = await lessonService.repeatStep(sessionId);
      audioService.generateAudioAndVisemes(textResponse, ws);
    }
  });
};
