// services/audioService.js
const ttsService = require("./ttsService");
const visemeService = require("./visemeService");

class AudioService {
  async generateAudioAndVisemes(text, ws) {
    // TTS → PCM chunks
    const audioStream = await ttsService.streamAudio(text);

    // For each chunk, generate viseme frames
    for await (const chunk of audioStream) {
      const visemes = visemeService.generateVisemes(chunk);

      ws.send(
        JSON.stringify({
          type: "audio",
          audio: chunk.toString("base64"),
          visemes,
        })
      );
    }
  }
}

module.exports = new AudioService();
