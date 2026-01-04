import { useState } from "react";
import { uploadSlides } from "../api/fileApi";

export default function SlideUploader({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState("");

  async function handleUpload() {
    if (!file) return;
    setProgress("Uploading...");

    try {
      const data = await uploadSlides(file);
      setProgress("Upload complete!");
      onUploaded(data);
    } catch {
      setProgress("Upload failed");
    }
  }

  return (
    <div className="p-4 bg-[#0004] rounded mb-4">
      <input
        type="file"
        accept=".pdf,.ppt,.pptx"
        onChange={(e) => setFile(e.target.files[0])}
        className="text-white mb-2"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 px-4 py-2 rounded text-white"
      >
        Upload Slides
      </button>

      {progress && <p className="text-sm text-gray-300 mt-2">{progress}</p>}
    </div>
  );
}
