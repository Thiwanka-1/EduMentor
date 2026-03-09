import { Upload, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

export default function AceCreate() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ===== STATE =====
  const [files, setFiles] = useState([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questionTypes, setQuestionTypes] = useState({
    mcq: true,
    tf: false,
    short: true,
  });

  // ===== HANDLERS =====
  function handleBrowseClick() {
    fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const selectedFiles = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + " MB",
    }));
    setFiles(selectedFiles);
  }

  function toggleQuestionType(type) {
    setQuestionTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }

  function increaseCount() {
    setQuestionCount((c) => Math.min(15, c + 1));
  }

  function decreaseCount() {
    setQuestionCount((c) => Math.max(1, c - 1));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ================= LEFT ================= */}
      <div className="lg:col-span-2 space-y-6">
        <p className="text-sm text-slate-500">
          Dashboard / <span className="text-white">New Study Set</span>
        </p>

        <h1 className="text-3xl font-semibold">
          Create{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Adaptive Material
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl">
          Upload your course notes to generate AI-powered quizzes.
        </p>

        {/* Upload */}
        <div className="rounded-3xl border border-white/10 bg-[#070b18]
                        p-10 text-center hover:border-indigo-500/40 transition">
          <div className="w-14 h-14 mx-auto rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-indigo-400" />
          </div>

          <h3 className="font-semibold mb-1">Upload Source Material</h3>
          <p className="text-sm text-slate-400 mb-5">
            PDF, DOCX, PNG (Max 50MB)
          </p>

          <button
            onClick={handleBrowseClick}
            className="px-5 py-2 rounded-xl bg-white text-black text-sm font-semibold"
          >
            Browse Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.png"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500 mb-3">
              UPLOADED FILES ({files.length})
            </p>

            <div className="space-y-3">
              {files.map((f) => (
                <div
                  key={f.name}
                  className="rounded-xl border border-white/10 bg-[#070b18] p-4"
                >
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.size}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= RIGHT ================= */}
      <div className="rounded-3xl border border-white/10 bg-[#070b18] p-6 space-y-6">
        <h3 className="font-semibold">Configuration</h3>

        {/* Question Types */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">
            QUESTION TYPES
          </p>

          <ConfigOption
            title="MCQ"
            desc="Standard 4-option questions"
            active={questionTypes.mcq}
            onClick={() => toggleQuestionType("mcq")}
          />
          <ConfigOption
            title="True / False"
            desc="Quick concept validation"
            active={questionTypes.tf}
            onClick={() => toggleQuestionType("tf")}
          />
          <ConfigOption
            title="Short Answer"
            desc="Definitions & explanations"
            active={questionTypes.short}
            onClick={() => toggleQuestionType("short")}
          />
        </div>

        {/* Difficulty */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">
            DIFFICULTY LEVEL
          </p>

          <div className="flex gap-2">
            {["Easy", "Medium", "Hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium
                  ${
                    difficulty === d
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">
            QUANTITY
          </p>

          <div className="flex items-center justify-between rounded-xl
                          border border-white/10 px-4 py-3">
            <span className="text-sm">Total Questions</span>

            <div className="flex items-center gap-3">
              <button
                onClick={decreaseCount}
                className="w-7 h-7 rounded-full bg-white/10"
              >
                −
              </button>
              <span className="font-semibold">{questionCount}</span>
              <button
                onClick={increaseCount}
                className="w-7 h-7 rounded-full bg-white/10"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/ace/session")}
          className="w-full py-3 rounded-xl font-semibold flex items-center
                     justify-center gap-2
                     bg-gradient-to-r from-indigo-500 to-cyan-500
                     hover:opacity-90 transition"
        >
          <Sparkles className="w-4 h-4" />
          Generate Study Set
        </button>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function ConfigOption({ title, desc, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 mb-2 cursor-pointer transition
        ${
          active
            ? "border-indigo-500/50 bg-indigo-600/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-slate-400">{desc}</p>
    </div>
  );
}
