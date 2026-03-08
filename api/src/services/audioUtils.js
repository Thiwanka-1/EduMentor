// backend/services/audioUtils.js

export function wavDurationMsFromBuffer(wavBuf) {
  try {
    const buf = Buffer.isBuffer(wavBuf) ? wavBuf : Buffer.from(wavBuf);
    if (buf.length < 44) return 0;

    const byteRate = buf.readUInt32LE(28);
    const dataSize = buf.readUInt32LE(40);

    if (!byteRate || !dataSize) return 0;
    const seconds = dataSize / byteRate;
    return Math.max(0, Math.round(seconds * 1000));
  } catch {
    return 0;
  }
}

export function toBase64Wav(wavBuf) {
  const buf = Buffer.isBuffer(wavBuf) ? wavBuf : Buffer.from(wavBuf);
  return buf.toString("base64");
}
