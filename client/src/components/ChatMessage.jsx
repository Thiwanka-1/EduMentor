// client/src/components/ChatMessage.jsx
import React from "react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  
  // Updated user bubble to indigo and assistant border to indigo/cyan
  const bubble = isUser
    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-sm"
    : "bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-50 border border-slate-200 dark:border-indigo-500/40 rounded-2xl rounded-tl-sm shadow-sm";

  return (
    <div className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className={`${bubble} px-4 py-3 whitespace-pre-wrap text-sm`}>
          {message.content}
        </div>

        {!isUser && (message.mood || typeof message.motivationLevel === "number") && (
          <div className="mt-1 flex gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {message.mood && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/70">
                mood: {message.mood}
              </span>
            )}
            {typeof message.motivationLevel === "number" && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/70">
                motivation: {message.motivationLevel}/5
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}