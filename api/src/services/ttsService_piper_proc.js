// backend/services/ttsService_piper_proc.js
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

export async function ttsToWavBufferWithProc(text, setProc) {
  const PIPER_BIN = process.env.PIPER_BIN || "piper";
  const PIPER_MODEL = process.env.PIPER_MODEL;

  if (!PIPER_MODEL) throw new Error("PIPER_MODEL not set in .env");

  const outPath = path.join(os.tmpdir(), `piper_${uuidv4()}.wav`);

  return new Promise((resolve, reject) => {
    const p = spawn(PIPER_BIN, ["--model", PIPER_MODEL, "--output_file", outPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // ✅ give process to wsLesson so Stop can kill it
    setProc?.(p);

    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", (e) => reject(e));

    p.stdin.write(String(text || ""));
    p.stdin.end();

    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(`Piper failed (code ${code}): ${err}`));

      try {
        const wav = fs.readFileSync(outPath);
        fs.unlinkSync(outPath);
        resolve(wav);
      } catch (e) {
        reject(e);
      }
    });
  });
}
