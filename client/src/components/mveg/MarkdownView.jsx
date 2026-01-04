import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ text }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, children, ...props }) {
            if (inline) {
              return (
                <code
                  className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-white/10"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="rounded-2xl p-4 overflow-x-auto bg-slate-950 text-slate-100">
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
