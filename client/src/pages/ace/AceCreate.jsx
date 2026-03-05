import { useState, useRef, useCallback } from "react";
import { Upload, Sparkles, X, FileText, Image, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { uploadMaterial, generateQuiz } from "../../services/aceApi";

const QUESTION_TYPES = [
  { key: "multiple_choice", title: "Multiple Choice", desc: "Standard 4-option questions" },
  { key: "true_false", title: "True / False", desc: "Quick concept validation" },
  { key: "short_answer", title: "Short Answer", desc: "Fill in the blanks & definitions" },
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

export default function AceCreate() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── State ─────────────────────────────────────────────────
  const [files, setFiles] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(["multiple_choice"]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [quantity, setQuantity] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [materialId, setMaterialId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // { type, message }
  const [error, setError] = useState(null);

  // ── File handling ─────────────────────────────────────────
  const handleFiles = useCallback((newFiles) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
    const valid = Array.from(newFiles).filter((f) => allowed.includes(f.type));
    if (valid.length < newFiles.length) {
      setError("Some files were skipped — only PDF, DOCX, and PNG are supported.");
    }
    setFiles((prev) => [...prev, ...valid]);
    setMaterialId(null); // reset if new files added
    setUploadStatus(null);
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setMaterialId(null);
    setUploadStatus(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // ── Toggle question type ──────────────────────────────────
  const toggleType = (key) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  // ── Upload + Generate ─────────────────────────────────────
  const handleGenerate = async () => {
    if (files.length === 0) {
      setError("Please upload at least one file before generating.");
      return;
    }

    setError(null);

    try {
      // Step 1: Upload files (if not yet uploaded)
      let matId = materialId;
      if (!matId) {
        setUploading(true);
        setUploadStatus({ type: "info", message: "Uploading and extracting text..." });

        const uploadRes = await uploadMaterial(files);
        matId = uploadRes.materialId;
        setMaterialId(matId);
        setUploadStatus({ type: "success", message: `Extracted ${uploadRes.textLength.toLocaleString()} characters from ${uploadRes.files.length} file(s)` });
        setUploading(false);
      }

      // Step 2: Generate quiz
      setGenerating(true);
      setUploadStatus({ type: "info", message: "AI is generating your quiz… this may take up to a minute." });

      const quizType =
        selectedTypes.length === 1
          ? selectedTypes[0]
          : selectedTypes.length > 1
          ? "mixed"
          : "multiple_choice";

      const result = await generateQuiz({
        materialId: matId,
        questionType: quizType,
        difficulty: difficulty.toLowerCase(),
        quantity,
      });

      setGenerating(false);
      setUploadStatus({ type: "success", message: `Generated ${result.questions.length} questions!` });

      // Navigate to session with quiz data
      navigate("/ace/session", {
        state: {
          quizId: result.quizId,
          questions: result.questions,
          config: result.config,
          materialId: matId,
        },
      });
    } catch (err) {
      setUploading(false);
      setGenerating(false);
      setError(err.message || "Something went wrong. Please try again.");
      setUploadStatus(null);
    }
  };

  const isProcessing = uploading || generating;

  // ── File icon helper ──────────────────────────────────────
  function fileIcon(file) {
    if (file.type === "application/pdf") return <FileText className="w-5 h-5 text-red-400" />;
    if (file.type.startsWith("image/")) return <Image className="w-5 h-5 text-cyan-400" />;
    return <FileText className="w-5 h-5 text-indigo-400" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ================= LEFT ================= */}
      <div className="lg:col-span-2 space-y-6">
        {/* Breadcrumb */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dashboard / <span className="text-slate-900 dark:text-white">New Study Set</span>
        </p>

        <h1 className="text-3xl font-semibold">
          Create{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Adaptive Material
          </span>
        </h1>

        <p className="text-slate-500 dark:text-slate-400 max-w-xl">
          Upload your course notes to generate AI-powered quizzes. Our engine
          reinforces weak points automatically.
        </p>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status */}
        {uploadStatus && (
          <div
            className={`rounded-xl border p-4 text-sm flex items-center gap-3 ${
              uploadStatus.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
            }`}
          >
            {uploadStatus.type === "info" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {uploadStatus.message}
          </div>
        )}

        {/* Upload Card */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-[#070b18]
                     p-10 flex flex-col items-center justify-center text-center
                     hover:border-indigo-500/40 transition cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-indigo-400" />
          </div>

          <h3 className="font-semibold mb-1">Upload Source Material</h3>

          <p className="text-sm text-slate-400 mb-5">
            Drag & drop files here or click browse.
            <br />
            Supported: PDF, DOCX, PNG (Max 50MB)
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-black
                       text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition"
          >
            Browse Files
          </button>
        </div>

        {/* Uploaded files */}
        {files.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500 mb-3">
              UPLOADED FILES ({files.length})
            </p>

            <div className="space-y-3">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between
                             rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#070b18] p-4"
                >
                  <div className="flex items-center gap-3">
                    {fileIcon(f)}
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-slate-400">
                        {(f.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                        {materialId ? "Processed" : "Ready for processing"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${materialId ? "text-emerald-400" : "text-amber-400"}`}>
                      {materialId ? "✔ Processed" : "⏳ Pending"}
                    </span>
                    {!isProcessing && (
                      <button
                        onClick={() => removeFile(i)}
                        className="text-slate-400 hover:text-red-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= RIGHT ================= */}
      <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#070b18] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Configuration</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            AI Engine Ready
          </span>
        </div>

        {/* Question Types */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">QUESTION TYPES</p>

          {QUESTION_TYPES.map((t) => (
            <ConfigOption
              key={t.key}
              title={t.title}
              desc={t.desc}
              active={selectedTypes.includes(t.key)}
              onClick={() => toggleType(t.key)}
            />
          ))}
        </div>

        {/* Difficulty */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">DIFFICULTY LEVEL</p>

          <div className="flex gap-2">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition
                  ${
                    difficulty === d
                      ? "bg-indigo-600 text-white"
                      : "bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">QUANTITY</p>

          <div
            className="flex items-center justify-between rounded-xl
                        border border-black/5 dark:border-white/10 px-4 py-3"
          >
            <span className="text-sm">Total Questions</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex flex-shrink-0 items-center justify-center
                           hover:bg-black/10 dark:hover:bg-white/20 transition"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQuantity(isNaN(val) ? "" : Math.max(1, val));
                }}
                onBlur={() => setQuantity((q) => (!q || q < 1 ? 1 : q))}
                className="font-semibold w-12 text-center bg-transparent outline-none focus:ring-0 border-none p-0
                           text-slate-900 dark:text-white"
              />
              <button
                onClick={() => setQuantity((q) => (parseInt(q) || 0) + 1)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex flex-shrink-0 items-center justify-center
                           hover:bg-black/10 dark:hover:bg-white/20 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleGenerate}
          disabled={isProcessing || files.length === 0}
          className="w-full py-3 rounded-xl font-semibold flex items-center
                     justify-center gap-2
                     bg-gradient-to-r from-indigo-500 to-cyan-500
                     hover:opacity-90 transition
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? "Processing Files…" : "Generating Quiz…"}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Study Set
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center">
          Estimated processing time: ~45 seconds per file
        </p>
      </div>
    </div>
  );
}

/* ================= SUB COMPONENT ================= */

function ConfigOption({ title, desc, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 mb-2 cursor-pointer transition
        ${
          active
            ? "border-indigo-500/50 bg-indigo-600/10"
            : "border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/20"
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
            active ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600"
          }`}
        >
          {active && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </div>
  );
}
