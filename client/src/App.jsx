import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";

function NotFoundInline() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="text-center p-8">
        <p className="text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400">
          404
        </p>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold">
          Page not found
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The page you’re looking for doesn’t exist (yet).
        </p>
        <a
          href="/"
          className="inline-flex mt-6 items-center justify-center rounded-xl px-5 py-3 text-sm font-medium
                     bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200
                     transition"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Placeholder routes (we’ll build these pages next, after Home is confirmed) */}
      <Route path="/about" element={<Navigate to="/" replace />} />
      <Route path="/contact" element={<Navigate to="/" replace />} />

      <Route path="*" element={<NotFoundInline />} />
    </Routes>
  );
}
