// client/src/components/ChatMessage.jsx
import React from "react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";
  
  // Cleaned up dark mode classes. Assistant bubble is now purely white with a soft border.
  const bubble = isUser
    ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md"
    : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm";

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div className={`${bubble} px-5 py-3.5 whitespace-pre-wrap text-sm leading-relaxed`}>
          {message.content}
        </div>

        {!isUser && (message.mood || typeof message.motivationLevel === "number") && (
          <div className="mt-1.5 flex gap-2 text-[11px] font-bold uppercase tracking-wider">
            {message.mood && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                mood: {message.mood}
              </span>
            )}
            {typeof message.motivationLevel === "number" && (
              <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                motivation: {message.motivationLevel}/5
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}