import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ text }) {
  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-strong:text-slate-900">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, children, ...props }) {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="rounded-xl p-4 overflow-x-auto bg-slate-950 text-slate-100 text-sm">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          a({ children, ...props }) {
            return (
              <a
                {...props}
                className="text-indigo-600 font-semibold hover:text-cyan-600 underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text || ""}
      </ReactMarkdown>
    </div>
  );
}
