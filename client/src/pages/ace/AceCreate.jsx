import { Upload, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AceCreate() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ================= LEFT ================= */}
      <div className="lg:col-span-2 space-y-6">
        {/* Breadcrumb */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dashboard / <span className="text-white">New Study Set</span>
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

        {/* Upload Card */}
        <div
          className="rounded-3xl border border-white/10 bg-[#070b18]
                     p-10 flex flex-col items-center justify-center text-center
                     hover:border-indigo-500/40 transition"
        >
          <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-indigo-400" />
          </div>

          <h3 className="font-semibold mb-1">
            Upload Source Material
          </h3>

          <p className="text-sm text-slate-400 mb-5">
            Drag & drop files here or click browse.
            <br />
            Supported: PDF, DOCX, PNG (Max 50MB)
          </p>

          <button
            className="px-5 py-2 rounded-xl bg-white text-black
                       text-sm font-semibold hover:bg-slate-200 transition"
          >
            Browse Files
          </button>
        </div>

        {/* Uploaded files (fake data) */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500 mb-3">
            UPLOADED FILES (2)
          </p>

          <div className="space-y-3">
            {[
              {
                name: "Introduction_to_Neuroscience.pdf",
                size: "4.2 MB",
              },
              {
                name: "Lecture_Slides_Week3.png",
                size: "1.8 MB",
              },
            ].map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between
                           rounded-xl border border-white/10 bg-[#070b18] p-4"
              >
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-slate-400">
                    {f.size} • Ready for processing
                  </p>
                </div>

                <span className="text-xs text-emerald-400">
                  ✔ Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="rounded-3xl border border-white/10 bg-[#070b18] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Configuration</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            AI Engine Ready
          </span>
        </div>

        {/* Question Types */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">
            QUESTION TYPES
          </p>

          <ConfigOption
            title="Multiple Choice"
            desc="Standard 4-option questions"
            active
          />
          <ConfigOption
            title="True / False"
            desc="Quick concept validation"
          />
          <ConfigOption
            title="Short Answer"
            desc="Fill in the blanks & definitions"
            active
          />
        </div>

        {/* Difficulty */}
        <div>
          <p className="text-xs font-semibold mb-3 text-slate-400">
            DIFFICULTY LEVEL
          </p>

          <div className="flex gap-2">
            {["Easy", "Medium", "Hard"].map((d, i) => (
              <button
                key={d}
                className={`flex-1 py-2 rounded-xl text-sm font-medium
                  ${
                    i === 1
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
              <button className="w-7 h-7 rounded-full bg-white/10">−</button>
              <span className="font-semibold">20</span>
              <button className="w-7 h-7 rounded-full bg-white/10">+</button>
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

        <p className="text-[11px] text-slate-500 text-center">
          Estimated processing time: ~45 seconds per file
        </p>
      </div>
    </div>
  );
}

/* ================= SUB COMPONENT ================= */

function ConfigOption({ title, desc, active }) {
  return (
    <div
      className={`rounded-xl border p-4 mb-2 cursor-pointer
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
