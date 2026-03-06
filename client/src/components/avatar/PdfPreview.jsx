import { useEffect, useState } from "react";

export default function PdfPreview({ file }) {
  const [img, setImg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setErr(null);
      setImg(null);
      if (!file) return;

      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) return;

      try {
        const pdfjs = await import("pdfjs-dist/build/pdf");
        // ✅ vite-friendly worker
        const workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1.3 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");

        if (alive) setImg(dataUrl);
      } catch (e) {
        if (alive) setErr("Preview failed (pdfjs).");
        console.warn(e);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className="flex items-start gap-3">
      <div className="w-[120px] h-[90px] rounded-xl overflow-hidden border border-white/15 bg-white/5 grid place-items-center">
        {img ? (
          <img src={img} alt="PDF preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-white/60 px-2 text-center">
            {err ? "No preview" : "Generating…"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{file.name}</div>
        <div className="text-xs text-white/55">
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </div>
        <div className="mt-1 inline-flex items-center gap-2 text-xs text-white/50">
          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
            PDF
          </span>
          <span>First-page thumbnail</span>
        </div>
      </div>
    </div>
  );
}
