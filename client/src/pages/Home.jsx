import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "edumentor_theme";

function useTheme() {
  const getInitial = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    const root = document.documentElement; // ✅ this must change <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}

function Icon({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center w-10 h-10 rounded-2xl " +
        "bg-slate-900 text-white dark:bg-white dark:text-slate-900 " +
        className
      }
    >
      {children}
    </span>
  );
}

function ModuleCard({ title, desc, tag, accent = "indigo" }) {
  const accentGlow = {
    indigo: "from-indigo-500/25 via-violet-500/10 to-transparent",
    teal: "from-teal-500/25 via-cyan-500/10 to-transparent",
    sky: "from-sky-500/25 via-indigo-500/10 to-transparent",
    emerald: "from-emerald-500/25 via-teal-500/10 to-transparent",
  }[accent];

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6
                 shadow-[0_14px_55px_-35px_rgba(2,6,23,0.55)]
                 backdrop-blur transition hover:-translate-y-1
                 dark:border-white/10 dark:bg-slate-950/40"
    >
      <div
        className={
          "pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl " +
          "bg-gradient-to-br " +
          accentGlow +
          " opacity-70 group-hover:opacity-100 transition"
        }
      />
      <div className="relative flex items-start gap-4">
        <Icon className="shrink-0">{title[0]}</Icon>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold
                         bg-slate-100 text-slate-600 ring-1 ring-slate-200
                         dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
            >
              {tag}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {desc}
          </p>

          <button
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold
                       text-slate-900 dark:text-white"
            type="button"
            onClick={() => alert(`Open: ${title} (we'll connect routes later)`)}
          >
            Open
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>

      {/* subtle animated shine */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute inset-0 translate-y-[-60%] group-hover:translate-y-[160%]
                        duration-[1400ms]
                        bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.08),transparent)]
                        dark:bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.06),transparent)]" />
      </div>
    </div>
  );
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Clean futuristic background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_20%_10%,rgba(99,102,241,0.18),transparent_60%)] dark:bg-[radial-gradient(900px_450px_at_20%_10%,rgba(99,102,241,0.28),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_80%_20%,rgba(20,184,166,0.14),transparent_60%)] dark:bg-[radial-gradient(900px_450px_at_80%_20%,rgba(20,184,166,0.20),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.09]
                        bg-[linear-gradient(to_right,rgba(15,23,42,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.7)_1px,transparent_1px)]
                        bg-[size:72px_72px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
        <div className="mx-auto max-w-screen-2xl px-5 lg:px-10">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-2xl bg-slate-900 dark:bg-white" />
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-indigo-500/35 via-teal-400/15 to-transparent blur-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">EduMentor</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  AI-powered learning suite
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-200">
              <a href="#modules" className="hover:text-slate-900 dark:hover:text-white transition">
                Modules
              </a>
              <a href="#about" className="hover:text-slate-900 dark:hover:text-white transition">
                About
              </a>
              <a href="#contact" className="hover:text-slate-900 dark:hover:text-white transition">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="#modules"
                className="hidden sm:inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold
                           bg-slate-900 text-white hover:bg-slate-800
                           dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
              >
                Explore
              </a>

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

      {/* Hero */}
      <section className="mx-auto max-w-screen-2xl px-5 lg:px-10 pt-12 lg:pt-16 pb-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold
                         bg-white/70 text-slate-700 ring-1 ring-slate-200 backdrop-blur
                         dark:bg-slate-950/40 dark:text-slate-200 dark:ring-white/10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.65)]" />
              Prototype-focused • PP1 ready UI
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl xl:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Learn faster with a{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">
                futuristic AI mentor
              </span>
              .
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
              EduMentor combines a StudyBuddy Agent, Multi-View Explanations, a 3D Avatar Tutor,
              and an Adaptive Reinforcement Engine—built to guide university students from
              confusion to mastery.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href="#modules"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                           bg-slate-900 text-white hover:bg-slate-800
                           dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
              >
                View modules →
              </a>

              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                           border border-slate-200/70 bg-white/70 hover:bg-white
                           dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition"
              >
                What is EduMentor?
              </a>
            </div>

            {/* Small stats (kept minimal) */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { k: "4", v: "Modules" },
                { k: "Multi-View", v: "Explain" },
                { k: "Adaptive", v: "Reinforce" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur
                             dark:border-white/10 dark:bg-slate-950/40"
                >
                  <p className="text-lg font-semibold">{s.k}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual (more “image-like”, animated) */}
          <div className="relative">
            <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl animate-[float_7s_ease-in-out_infinite]" />
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-teal-500/20 blur-2xl animate-[float_8s_ease-in-out_infinite]" />

            <div
              className="relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/70 p-6
                         shadow-[0_18px_80px_-45px_rgba(2,6,23,0.55)]
                         backdrop-blur dark:border-white/10 dark:bg-slate-950/40"
            >
              {/* “screenshot” top bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Live UI preview
                </span>
              </div>

              {/* Illustration */}
              <div className="mt-5 grid sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Student asks</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      “Explain recursion in 4 styles”
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40">
                    <p className="text-xs text-slate-500 dark:text-slate-400">EduMentor responds</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Simple", "Analogy", "Code", "Visual"].map((m) => (
                        <span
                          key={m}
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold
                                     bg-slate-100 text-slate-700 ring-1 ring-slate-200
                                     dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <svg
                    viewBox="0 0 400 320"
                    className="w-full h-auto rounded-2xl border border-slate-200/70 bg-white/60 dark:border-white/10 dark:bg-white/5"
                  >
                    <defs>
                      <radialGradient id="g1" cx="40%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.55)" />
                        <stop offset="55%" stopColor="rgba(20,184,166,0.25)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                      </radialGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(99,102,241,0.25)" />
                        <stop offset="100%" stopColor="rgba(20,184,166,0.18)" />
                      </linearGradient>
                    </defs>

                    <rect x="0" y="0" width="400" height="320" fill="url(#g2)" />
                    <circle cx="190" cy="150" r="120" fill="url(#g1)" />

                    {/* “Avatar” head */}
                    <ellipse cx="270" cy="140" rx="58" ry="64" fill="rgba(255,255,255,0.35)" />
                    <ellipse cx="250" cy="130" rx="10" ry="12" fill="rgba(15,23,42,0.65)" />
                    <ellipse cx="292" cy="130" rx="10" ry="12" fill="rgba(15,23,42,0.65)" />
                    <path
                      d="M248 165 C265 180, 280 180, 298 165"
                      stroke="rgba(15,23,42,0.55)"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* “cards” */}
                    <rect x="40" y="220" width="220" height="18" rx="9" fill="rgba(255,255,255,0.35)" />
                    <rect x="40" y="250" width="180" height="18" rx="9" fill="rgba(255,255,255,0.25)" />
                  </svg>

                  <div className="absolute -top-3 -right-3 rounded-2xl px-3 py-2 text-xs font-semibold
                                  bg-slate-900 text-white dark:bg-white dark:text-slate-900
                                  shadow-[0_12px_45px_-20px_rgba(2,6,23,0.6)]
                                  animate-[float_6s_ease-in-out_infinite]">
                    3D Tutor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="mx-auto max-w-screen-2xl px-5 lg:px-10 pb-16">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400">
              Modules
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              One platform, four powerful engines
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl">
              Consistent UI, shared theme, and scalable structure. We’ll connect actual routes + backend later.
            </p>
          </div>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleCard
            accent="teal"
            title="StudyBuddy Agent"
            tag="Guided Q&A"
            desc="Ask questions on your lecture content and get structured help and next steps."
          />
          <ModuleCard
            accent="indigo"
            title="Multi-View Explanation"
            tag="4 Views"
            desc="Simple • Analogy • Code • Visual explanations to match different learners."
          />
          <ModuleCard
            accent="sky"
            title="3D Avatar Tutor"
            tag="Interactive"
            desc="A future-ready tutor interface for speech + expressions and better engagement."
          />
          <ModuleCard
            accent="emerald"
            title="ACE Reinforcement"
            tag="Mastery"
            desc="Adaptive reinforcement sessions, quizzes, and mastery tracking for retention."
          />
        </div>
      </section>

      {/* About (small, clean) */}
      <section id="about" className="mx-auto max-w-screen-2xl px-5 lg:px-10 pb-16">
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 md:p-10 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400">
            About
          </p>
          <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
            Built for real student pain points
          </h3>
          <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            EduMentor is a research-driven learning platform focused on clarity, personalization,
            and retention. The design aims to be demo-friendly (PP1) while staying scalable for
            full integration later.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-screen-2xl px-5 lg:px-10 pb-16">
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 md:p-10 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400">
                Contact
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Need a supervisor demo or prototype review?
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                Email us anytime: <span className="font-semibold">edumentor.team@gmail.com</span>
              </p>
            </div>

            <a
              href="mailto:edumentor.team@gmail.com"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                         bg-slate-900 text-white hover:bg-slate-800
                         dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
            >
              Send email →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-white/10">
        <div className="mx-auto max-w-screen-2xl px-5 lg:px-10 py-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p className="text-sm font-semibold">EduMentor</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {year} EduMentor Team • React + Vite + Tailwind
          </p>
        </div>
      </footer>

      {/* Small keyframe animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
