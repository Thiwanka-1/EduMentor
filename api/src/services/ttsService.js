import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { visemeMap } from "./visemeMap.js";

const piperDir = path.join(process.cwd(), "piper");
const piperExe = path.join(piperDir, "piper.exe");
const modelPath = path.join(piperDir, "amy.onnx");
const configPath = path.join(piperDir, "amy.onnx.json");

export function generateAudioAndVisemes(text) {
  return new Promise((resolve) => {
    const safe = text.replace(/[^\x00-\x7F]/g, "");

    const wavFile = path.join(piperDir, `tts_${Date.now()}.wav`);

    const p = spawn(piperExe, [
      "--model", modelPath,
      "--config", configPath,
      "--json-input",
      "--output_file", wavFile,
      "--espeak_data", path.join(piperDir, "espeak-ng-data")
    ]);

    let phonemeJSON = "";

    p.stderr.on("data", (d) => {
      phonemeJSON += d.toString();
    });

    p.on("close", () => {
      if (!fs.existsSync(wavFile)) {
        console.log("❌ Piper did not create WAV");
        return resolve({ audioBase64: null, visemes: [] });
      }

      const wav = fs.readFileSync(wavFile);
      fs.unlinkSync(wavFile);

      let visemes = [];

      try {
        const parsed = JSON.parse(phonemeJSON);

        if (parsed.phoneme) {
          visemes = parsed.phoneme.map(p => ({
            time: p.start,
            viseme: visemeMap[p.phoneme] || "rest"
          }));
        }
      } catch { }

      resolve({
        audioBase64: wav.toString("base64"),
        visemes
      });
    });

    // SEND TEXT AS JSON (required by your Piper version)
    p.stdin.write(JSON.stringify({ text: safe }) + "\n");
    p.stdin.end();
  });
}
