import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ text }) {
  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-strong:text-slate-900 prose-code:text-slate-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, children, ...props }) {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-sm font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="rounded-xl p-4 overflow-x-auto bg-slate-100 border border-slate-200 text-sm text-slate-800">
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {text || ""}
      </ReactMarkdown>
    </div>
  );
}
