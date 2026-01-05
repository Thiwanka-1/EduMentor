import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const STORAGE_KEY = "edumentor_theme";

function useTheme() {
  const getInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark =
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}

function ChipNav({ to, label, isActive }) {
  return (
    <NavLink
      to={to}
      className={[
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
        "border bg-white/60 backdrop-blur",
        "dark:bg-slate-950/40",
        isActive
          ? "border-emerald-400/40 text-emerald-700 shadow-[0_10px_35px_-25px_rgba(16,185,129,0.55)] dark:text-emerald-300"
          : "border-slate-200/70 text-slate-700 hover:bg-white/80 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-900/50",
      ].join(" ")}
    >
      {label}
    </NavLink>
  );
}

function TopNav({ theme, setTheme }) {
  const location = useLocation();
  const path = location.pathname;

  // basic active checks
  const activeHome = path === "/" || path.startsWith("/home");
  const activeStudy = path.startsWith("/study-buddy");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 dark:bg-white" />
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-teal-400/15 to-transparent blur-xl" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                EduMentor
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AI-powered learning suite
              </p>
            </div>
          </Link>

          {/* Module navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <ChipNav to="/" label="Home" isActive={activeHome} />
            <ChipNav to="/study-buddy" label="StudyBuddy" isActive={activeStudy} />

            {/* coming soon chips */}
            <span
              className="inline-flex items-center rounded-2xl px-3 py-2 text-sm font-semibold
                         border border-slate-200/70 bg-white/40 text-slate-400
                         dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-600"
              title="Coming soon"
            >
              MVEG
            </span>
            <span
              className="inline-flex items-center rounded-2xl px-3 py-2 text-sm font-semibold
                         border border-slate-200/70 bg-white/40 text-slate-400
                         dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-600"
              title="Coming soon"
            >
              3D Tutor
            </span>
            <span
              className="inline-flex items-center rounded-2xl px-3 py-2 text-sm font-semibold
                         border border-slate-200/70 bg-white/40 text-slate-400
                         dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-600"
              title="Coming soon"
            >
              ACE
            </span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/study-buddy"
              className="hidden sm:inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold
                         bg-slate-900 text-white hover:bg-slate-800
                         dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
            >
              Open Agent →
            </Link>

            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center justify-center rounded-2xl px-3 py-2
                         border border-slate-200/70 bg-white/70 hover:bg-white
                         dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60
                         transition"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);
  return (
    <footer className="border-t border-slate-200/70 dark:border-white/10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          EduMentor
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {year} EduMentor Team • React + Vite + Tailwind
        </p>
      </div>
    </footer>
  );
}

export default function AppShell({ children }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Futuristic background (VALID Tailwind) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_20%_10%,rgba(99,102,241,0.18),transparent_60%)] dark:bg-[radial-gradient(900px_450px_at_20%_10%,rgba(99,102,241,0.28),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_80%_20%,rgba(20,184,166,0.14),transparent_60%)] dark:bg-[radial-gradient(900px_450px_at_80%_20%,rgba(20,184,166,0.22),transparent_60%)]" />

        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.10]
                     bg-[linear-gradient(to_right,rgba(15,23,42,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.7)_1px,transparent_1px)]
                     bg-[size:72px_72px]"
        />

        {/* soft floating glow */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-[float_9s_ease-in-out_infinite]" />
      </div>

      <TopNav theme={theme} setTheme={setTheme} />

      {/* Page content */}
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 lg:px-10 py-6">
        {children}
      </div>

      <SiteFooter />

      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
