import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Sparkles,
  X,
  FileText,
  Image,
  Loader2,
  Check,
  Clock,
  CheckSquare,
  Square,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  uploadMaterial,
  generateQuiz,
  getMaterials,
} from "../../services/aceApi";

const QUESTION_TYPES = [
  {
    key: "multiple_choice",
    title: "Multiple Choice",
    desc: "Standard 4-option questions",
  },
  {
    key: "true_false",
    title: "True / False",
    desc: "Quick concept validation",
  },
  {
    key: "short_answer",
    title: "Short Answer",
    desc: "Fill in the blanks & definitions",
  },
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

export default function AceCreate() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [localFiles, setLocalFiles] = useState([]);
  const [selectedLocalIds, setSelectedLocalIds] = useState(new Set());

  const [uploadedMats, setUploadedMats] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(["multiple_choice"]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [quantity, setQuantity] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("uploaded");
  const [historyMats, setHistoryMats] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const res = await getMaterials();
      setHistoryMats(
        (res.materials || []).map((m) => ({
          id: m.id,
          name: m.title || m.files?.[0]?.originalname || "Untitled",
          files: m.files || [],
          fileType: m.fileType,
          uploadedAt: m.uploadedAt || m.createdAt,
        })),
      );
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    setHistoryLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    if (activeTab === "history") {
      (async () => {
        setHistoryLoading(true);
        try {
          const res = await getMaterials();
          if (!cancelled) {
            setHistoryMats(
              (res.materials || []).map((m) => ({
                id: m.id,
                name: m.title || m.files?.[0]?.originalname || "Untitled",
                files: m.files || [],
                fileType: m.fileType,
                uploadedAt: m.uploadedAt || m.createdAt,
              })),
            );
          }
        } catch (err) {
          console.error("Failed to load history:", err);
        }
        if (!cancelled) setHistoryLoading(false);
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleFiles = useCallback((newFiles) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];

    const valid = Array.from(newFiles).filter((f) => allowed.includes(f.type));

    if (valid.length < newFiles.length) {
      setError(
        "Some files were skipped — only PDF, DOCX, and PNG are supported.",
      );
    }

    if (valid.length === 0) return;

    const tagged = valid.map((f) => ({
      localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
    }));

    setLocalFiles((prev) => [...prev, ...tagged]);

    setSelectedLocalIds((prev) => {
      const next = new Set(prev);
      tagged.forEach(({ localId }) => next.add(localId));
      return next;
    });

    setUploadStatus(null);
  }, []);

  const removeLocalFile = (localId) => {
    setLocalFiles((prev) => prev.filter((f) => f.localId !== localId));
    setSelectedLocalIds((prev) => {
      const next = new Set(prev);
      next.delete(localId);
      return next;
    });
    setUploadStatus(null);
  };

  const toggleLocalSelect = (localId) => {
    setSelectedLocalIds((prev) => {
      const next = new Set(prev);
      if (next.has(localId)) next.delete(localId);
      else next.add(localId);
      return next;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleType = (key) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key],
    );
  };

  const handleGenerate = async () => {
    const selectedLocalFiles = localFiles.filter((f) =>
      selectedLocalIds.has(f.localId),
    );
    const hasSelectedLocal =
      selectedLocalFiles.length > 0 && uploadedMats.length === 0;
    const hasSelectedHistory = selectedIds.length > 0;

    if (!hasSelectedLocal && !hasSelectedHistory) {
      setError("Please select at least one file.");
      return;
    }

    setError(null);

    try {
      const idSet = new Set(selectedIds);

      if (selectedLocalFiles.length > 0 && uploadedMats.length === 0) {
        setUploading(true);
        const newMats = [];
        let totalChars = 0;

        for (let i = 0; i < selectedLocalFiles.length; i++) {
          const { file } = selectedLocalFiles[i];
          setUploadStatus({
            type: "info",
            message: `Uploading file ${i + 1}/${selectedLocalFiles.length}: ${file.name}…`,
          });

          const uploadRes = await uploadMaterial([file]);
          newMats.push({ id: uploadRes.materialId, name: file.name });
          totalChars += uploadRes.textLength || 0;
          idSet.add(uploadRes.materialId);
        }

        setUploadedMats(newMats);
        setSelectedIds([...idSet]);

        setUploadStatus({
          type: "success",
          message: `Uploaded ${newMats.length} file(s) — ${totalChars.toLocaleString()} chars total`,
        });

        setUploading(false);
        fetchHistory();
      }

      const allIds = [...idSet];
      if (allIds.length === 0) {
        setError("Please select at least one file.");
        return;
      }

      setGenerating(true);
      setUploadStatus({
        type: "info",
        message: `AI is generating quiz from ${allIds.length} material(s)… this may take up to a minute.`,
      });

      const quizType =
        selectedTypes.length === 1
          ? selectedTypes[0]
          : selectedTypes.length > 1
            ? "mixed"
            : "multiple_choice";

      const result = await generateQuiz({
        materialIds: allIds,
        questionType: quizType,
        difficulty: difficulty.toLowerCase(),
        quantity,
      });

      setGenerating(false);
      setUploadStatus({
        type: "success",
        message: `Generated ${result.questions.length} questions!`,
      });

      navigate("/ace/session", {
        state: {
          quizId: result.quizId,
          questions: result.questions,
          config: result.config,
          materialId: result.materialId,
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
  const totalSelected =
    selectedIds.length +
    (uploadedMats.length === 0 ? selectedLocalIds.size : 0);

  const canGenerate = !isProcessing && totalSelected > 0;

  function fileIcon(file) {
    if (
      file?.type === "application/pdf" ||
      file?.mimetype === "application/pdf"
    ) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (
      file?.type?.startsWith("image/") ||
      file?.mimetype?.startsWith("image/")
    ) {
      return <Image className="w-5 h-5 text-cyan-500" />;
    }
    return <FileText className="w-5 h-5 text-indigo-500" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">
        <p className="text-sm text-slate-500">
          Dashboard / <span className="text-slate-900">New Study Set</span>
        </p>

        <h1 className="text-3xl font-semibold text-slate-900">
          Create{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            Adaptive Material
          </span>
        </h1>

        <p className="text-slate-500 max-w-xl">
          Upload your course notes to generate AI-powered quizzes. Our engine
          reinforces weak points automatically.
        </p>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 flex justify-between items-center">
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
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-indigo-200 bg-indigo-50 text-indigo-600"
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
          className="rounded-3xl border border-dashed border-slate-200 bg-white
                     p-10 flex flex-col items-center justify-center text-center
                     hover:border-indigo-300 transition cursor-pointer shadow-sm"
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

          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-indigo-600" />
          </div>

          <h3 className="font-semibold mb-1 text-slate-900">
            Upload Source Material
          </h3>

          <p className="text-sm text-slate-500 mb-5">
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
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white
                       text-sm font-semibold hover:bg-indigo-500 transition"
          >
            Browse Files
          </button>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-slate-200 mb-4">
            <button
              onClick={() => setActiveTab("uploaded")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "uploaded"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Uploaded Files {localFiles.length > 0 && `(${localFiles.length})`}
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              History {historyMats.length > 0 && `(${historyMats.length})`}
            </button>
          </div>

          {/* Uploaded Files */}
          {activeTab === "uploaded" && (
            <div className="space-y-3">
              {localFiles.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No files uploaded yet. Drag & drop or browse to add files.
                </p>
              ) : (
                localFiles.map(({ localId, file }) => {
                  const mat = uploadedMats.find((m) => m.name === file.name);
                  const isUploaded = !!mat;
                  const isSelected = isUploaded
                    ? selectedIds.includes(mat.id)
                    : selectedLocalIds.has(localId);

                  const handleClick = () => {
                    if (isUploaded) toggleSelect(mat.id);
                    else toggleLocalSelect(localId);
                  };

                  return (
                    <div
                      key={localId}
                      className={`flex items-center justify-between rounded-xl border p-4 transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      onClick={handleClick}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500 shrink-0" />
                        )}

                        {fileIcon(file)}

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                            {isUploaded ? "Processed" : "Ready for processing"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isSelected && (
                          <span className="text-xs text-indigo-600 font-medium">
                            Selected for quiz
                          </span>
                        )}

                        <span
                          className={`text-xs ${
                            isUploaded ? "text-emerald-600" : "text-amber-500"
                          }`}
                        >
                          {isUploaded ? "Processed" : "Pending"}
                        </span>

                        {!isProcessing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLocalFile(localId);
                            }}
                            className="text-slate-500 hover:text-rose-500 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* History */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading history…
                </div>
              ) : historyMats.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No previously uploaded materials found.
                </p>
              ) : (
                historyMats.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const filename =
                    m.files?.[0]?.originalname || m.name || "Untitled";

                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleSelect(m.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-500 shrink-0" />
                        )}

                        <FileText className="w-5 h-5 text-rose-500" />

                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {filename}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(m.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Selected for quiz
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Configuration</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            AI Engine Ready
          </span>
        </div>

        {/* Selected Files Counter */}
        <div className="rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">Selected Files</span>
          <span
            className={`text-sm font-bold ${
              totalSelected > 0 ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            {totalSelected}
          </span>
        </div>

        {/* Question Types */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-500">
            QUESTION TYPES
          </p>

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
          <p className="text-xs font-semibold mb-3 text-slate-500">
            DIFFICULTY LEVEL
          </p>

          <div className="flex gap-2">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  difficulty === d
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-500">QUANTITY</p>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-700">Total Questions</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
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
                className="font-semibold w-12 text-center bg-transparent outline-none border-none p-0 text-slate-900"
              />

              <button
                onClick={() => setQuantity((q) => (parseInt(q) || 0) + 1)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2
                     bg-gradient-to-r from-indigo-600 to-cyan-500 text-white
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

/* SUB COMPONENT */

function ConfigOption({ title, desc, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 mb-2 cursor-pointer transition ${
        active
          ? "border-indigo-300 bg-indigo-50"
          : "border-slate-200 bg-slate-50 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>

        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
            active ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
          }`}
        >
          {active && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </div>
  );
}
