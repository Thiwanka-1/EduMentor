import { Howl } from "howler";

export function playAudioChunk(base64Audio) {
  const binary = atob(base64Audio);
  const len = binary.length;
  const buffer = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }

  const sound = new Howl({
    src: [buffer.buffer],
    format: ["wav"]     // backend uses WAV/PCM
  });

  sound.play();
}
