import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * EduMentor — Futuristic Home (Responsive + Dark/Light)
 * - No auth / protected routes yet
 * - Theme toggler persists in localStorage
 * - Sections: Hero, Modules, How it works, Features, CTA, Footer
 */

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
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}

/* ---------- Small inline icon set (no extra dependency) ---------- */
function Icon({ name, className = "" }) {
  const common = `w-5 h-5 ${className}`;
  switch (name) {
    case "moon":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 13.1A8.5 8.5 0 0 1 10.9 3 7 7 0 1 0 21 13.1Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sun":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "arrow":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2l1.4 6.2L20 10l-6.6 1.8L12 18l-1.4-6.2L4 10l6.6-1.8L12 2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "brain":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8.5 21c-2.2 0-4-1.8-4-4v-1.2c-1-.7-1.5-1.9-1.5-3.1 0-1.5.9-2.8 2.2-3.4C5.4 6.4 7 5 9 5c.5-1.8 2.1-3 4-3 2.2 0 4 1.8 4 4v.2c1.7.6 3 2.2 3 4.1 0 1.5-.8 2.9-2 3.6V15c0 2.2-1.8 4-4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 8.5c.8 0 1.5.7 1.5 1.5v11M15 7.5c-.8 0-1.5.7-1.5 1.5v12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "cube":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 22v-11.2M20 6.5l-8 4.5-8-4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "layers":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2l9 5-9 5-9-5 9-5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M3 12l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M3 17l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "target":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 22a10 10 0 1 0-7.1-2.9A10 10 0 0 0 12 22Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 18a6 6 0 1 0-4.2-1.8A6 6 0 0 0 12 18Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 14a2 2 0 1 0-1.4-.6A2 2 0 0 0 12 14Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

function GlowPill({ children }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium
                 bg-white/60 text-slate-700 ring-1 ring-slate-200 shadow-sm backdrop-blur
                 dark:bg-slate-900/50 dark:text-slate-200 dark:ring-white/10"
    >
      <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.65)]" />
      {children}
    </span>
  );
}

function NavLink({ to, children }) {
  return (
    <a
      href={to}
      className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition"
    >
      {children}
    </a>
  );
}

function SectionTitle({ kicker, title, desc }) {
  return (
    <div className="max-w-3xl">
      {kicker && (
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400">
          {kicker}
        </p>
      )}
      <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      {desc && (
        <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          {desc}
        </p>
      )}
    </div>
  );
}

function FuturisticCard({ accent = "indigo", icon, title, desc, tag }) {
  const accentMap = {
    teal: "from-teal-500/30 via-cyan-400/10 to-transparent",
    indigo: "from-indigo-500/30 via-violet-400/10 to-transparent",
    sky: "from-sky-500/30 via-indigo-400/10 to-transparent",
    emerald: "from-emerald-500/30 via-teal-400/10 to-transparent",
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-5
                 shadow-[0_10px_40px_-20px_rgba(2,6,23,0.25)]
                 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_-25px_rgba(2,6,23,0.35)]
                 dark:border-white/10 dark:bg-slate-950/40"
    >
      {/* gradient glow */}
      <div
        className={classNames(
          "pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-70 transition group-hover:opacity-95",
          "bg-gradient-to-br",
          accentMap[accent] || accentMap.indigo
        )}
      />

      <div className="relative flex items-start gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl
                     bg-slate-900 text-white shadow-sm
                     dark:bg-white dark:text-slate-900"
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            {tag && (
              <span
                className="hidden sm:inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold
                           bg-slate-100 text-slate-600 ring-1 ring-slate-200
                           dark:bg-white/10 dark:text-slate-200 dark:ring-white/10"
              >
                {tag}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {desc}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            Open
            <span className="inline-flex transition group-hover:translate-x-1">
              <Icon name="arrow" className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* subtle scanline */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.06),transparent)] dark:bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.05),transparent)] translate-y-[-60%] group-hover:translate-y-[160%] duration-[1400ms]" />
      </div>
    </div>
  );
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  const onCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("edumentor.team@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Background (futuristic) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(99,102,241,0.16),transparent_60%)] dark:bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(99,102,241,0.24),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_80%_20%,rgba(20,184,166,0.14),transparent_60%)] dark:bg-[radial-gradient(1000px_500px_at_80%_20%,rgba(20,184,166,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_50%_85%,rgba(16,185,129,0.10),transparent_60%)] dark:bg-[radial-gradient(900px_450px_at_50%_85%,rgba(16,185,129,0.14),transparent_60%)]" />

        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.10] bg-[linear-gradient(to_right,rgba(15,23,42,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.6)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white" />
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500/35 via-teal-400/15 to-transparent blur-lg" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">
                  EduMentor
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Multi-agent learning suite
                </p>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="#modules">Modules</NavLink>
              <NavLink to="#how">How it works</NavLink>
              <NavLink to="#features">Features</NavLink>
              <NavLink to="#contact">Contact</NavLink>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href="#modules"
                className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold
                           bg-slate-900 text-white hover:bg-slate-800
                           dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
              >
                Explore
              </a>

              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2
                           border border-slate-200/70 bg-white/70 hover:bg-white
                           dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60
                           transition"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {theme === "dark" ? <Icon name="sun" /> : <Icon name="moon" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <GlowPill>Prototype-ready • Built with MERN + Vite + Tailwind</GlowPill>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white">
                A futuristic learning platform for{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">
                    university students
                  </span>
                  <span className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-indigo-500/20 via-violet-500/10 to-teal-500/20 blur-xl" />
                </span>
                .
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                EduMentor merges a StudyBuddy agent, Multi-View Explanation Generator,
                3D Avatar Tutor, and an Adaptive Reinforcement Engine to create a
                smooth, guided learning experience—from confusion to mastery.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="#modules"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                             bg-slate-900 text-white hover:bg-slate-800
                             dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
                >
                  Start exploring
                  <span className="ml-2"><Icon name="arrow" className="w-4 h-4" /></span>
                </a>

                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                             border border-slate-200/70 bg-white/70 hover:bg-white
                             dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition"
                >
                  How it works
                  <span className="ml-2"><Icon name="spark" className="w-4 h-4" /></span>
                </a>
              </div>

              {/* micro stats */}
              <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
                {[
                  { k: "4", v: "Core modules" },
                  { k: "Multi-View", v: "Explanations" },
                  { k: "Adaptive", v: "Reinforcement" },
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

            {/* Hero visual */}
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6
                           shadow-[0_18px_80px_-45px_rgba(2,6,23,0.55)]
                           backdrop-blur dark:border-white/10 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Live learning flow
                  </p>
                  <span className="rounded-full px-2 py-1 text-[11px] font-semibold bg-emerald-400/15 text-emerald-700 ring-1 ring-emerald-400/25 dark:text-emerald-300">
                    Demo UI
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    { t: "Upload lecture PDF", d: "StudyBuddy indexes content & builds context", a: "teal" },
                    { t: "Ask a question", d: "Get guided hints + citations + next steps", a: "sky" },
                    { t: "Generate multi-view explanation", d: "Simple • Analogy • Code • Visual", a: "indigo" },
                    { t: "Reinforce", d: "Adaptive quizzes + mastery tracking (ACE)", a: "emerald" },
                  ].map((row, i) => (
                    <div
                      key={row.t}
                      className={classNames(
                        "rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40",
                        "transition hover:-translate-y-0.5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          <span className="text-xs font-bold">{i + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {row.t}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {row.d}
                          </p>
                        </div>
                        <div className="ml-auto hidden sm:block">
                          <span
                            className={classNames(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                              row.a === "teal" && "bg-teal-400/15 text-teal-700 ring-teal-400/25 dark:text-teal-200",
                              row.a === "sky" && "bg-sky-400/15 text-sky-700 ring-sky-400/25 dark:text-sky-200",
                              row.a === "indigo" && "bg-indigo-400/15 text-indigo-700 ring-indigo-400/25 dark:text-indigo-200",
                              row.a === "emerald" && "bg-emerald-400/15 text-emerald-700 ring-emerald-400/25 dark:text-emerald-200"
                            )}
                          >
                            {row.a}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* bottom bar */}
                <div className="mt-5 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    “Explain recursion like I’m new to coding — then show a visual.”
                  </p>
                  <div className="mt-3 flex gap-2">
                    {["Simple", "Analogy", "Code", "Visual"].map((m) => (
                      <span
                        key={m}
                        className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold
                                   bg-white text-slate-700 ring-1 ring-slate-200
                                   dark:bg-slate-950/40 dark:text-slate-200 dark:ring-white/10"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* floating glow dots */}
              <div className="pointer-events-none absolute -top-6 -left-6 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-teal-500/20 blur-2xl" />
            </div>
          </div>
        </section>

        {/* Modules */}
        <section id="modules" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <SectionTitle
              kicker="Core Modules"
              title="Everything your learning journey needs"
              desc="Each module is designed as a seamless part of one unified experience — consistent UI, shared identity, and smooth navigation."
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Modular • Scalable • Research-ready
              </span>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="#" className="block">
              <FuturisticCard
                accent="teal"
                icon={<Icon name="brain" className="w-5 h-5" />}
                title="StudyBuddy Agent"
                tag="Guided Q&A"
                desc="Upload learning materials, ask questions, and get guided help with structured reasoning and next steps."
              />
            </a>

            <a href="#" className="block">
              <FuturisticCard
                accent="indigo"
                icon={<Icon name="layers" className="w-5 h-5" />}
                title="Multi-View Explanation"
                tag="4 Views"
                desc="Generate explanations in Simple, Analogy, Code, and Visual modes—built for fast understanding."
              />
            </a>

            <a href="#" className="block">
              <FuturisticCard
                accent="sky"
                icon={<Icon name="cube" className="w-5 h-5" />}
                title="3D Avatar Tutor"
                tag="Interactive"
                desc="A tutor that feels human—future-ready for speech, expressions, and immersive learning interactions."
              />
            </a>

            <a href="#" className="block">
              <FuturisticCard
                accent="emerald"
                icon={<Icon name="target" className="w-5 h-5" />}
                title="Adaptive Reinforcement (ACE)"
                tag="Mastery"
                desc="Personalized reinforcement sessions with quizzes and mastery tracking to lock learning long-term."
              />
            </a>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <SectionTitle
            kicker="Experience"
            title="A smooth flow from confusion to mastery"
            desc="We designed EduMentor like a modern product, not a generic chat. Everything is structured, visual, and easy to follow."
          />

          <div className="mt-8 grid lg:grid-cols-3 gap-4">
            {[
              {
                t: "Learn with guidance",
                d: "StudyBuddy helps you ask smarter questions and stay on track with structured help.",
              },
              {
                t: "Understand in your style",
                d: "MVEG produces multi-view explanations so any learner can understand fast.",
              },
              {
                t: "Reinforce automatically",
                d: "ACE schedules adaptive sessions so you actually retain and improve over time.",
              },
            ].map((x, idx) => (
              <div
                key={x.t}
                className="relative rounded-2xl border border-slate-200/70 bg-white/70 p-6 backdrop-blur
                           dark:border-white/10 dark:bg-slate-950/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    <span className="text-sm font-bold">{idx + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold">{x.t}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {x.d}
                </p>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Built for PP1 prototype demonstration.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <SectionTitle
              kicker="Design language"
              title="Futuristic UI that still feels simple"
              desc="Glass + glow + clean typography + smooth spacing. Built to look premium in both light and dark themes."
            />

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  t: "Unified design system",
                  d: "Shared layout across modules so the platform feels like one product.",
                },
                {
                  t: "Lightning navigation",
                  d: "Quick access to modules, actions, and history-friendly experiences later.",
                },
                {
                  t: "Responsive-first",
                  d: "Optimized for phones, tablets, laptops, and ultra-wide screens.",
                },
                {
                  t: "Theme control",
                  d: "User-friendly dark/light theme with persistent preference.",
                },
              ].map((f) => (
                <div
                  key={f.t}
                  className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 backdrop-blur
                             dark:border-white/10 dark:bg-slate-950/40"
                >
                  <p className="text-sm font-semibold">{f.t}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {f.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <div
            className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-8 sm:p-10 backdrop-blur
                       dark:border-white/10 dark:bg-slate-950/40"
          >
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-400/10 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-teal-500/25 via-emerald-400/10 to-transparent blur-3xl" />

            <div className="relative flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500 dark:text-slate-400">
                  Contact
                </p>
                <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                  Want to review our prototype or collaborate?
                </h3>
                <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Reach out to the EduMentor team for supervisor demos, documentation requests,
                  or integration discussions.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <a
                    href="mailto:edumentor.team@gmail.com"
                    className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                               bg-slate-900 text-white hover:bg-slate-800
                               dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
                  >
                    Email us
                    <span className="ml-2"><Icon name="arrow" className="w-4 h-4" /></span>
                  </a>

                  <button
                    type="button"
                    onClick={onCopyEmail}
                    className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold
                               border border-slate-200/70 bg-white/70 hover:bg-white
                               dark:border-white/10 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 transition"
                  >
                    {copied ? "Copied!" : "Copy email"}
                  </button>
                </div>

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Email: <span className="font-semibold">edumentor.team@gmail.com</span>
                </p>
              </div>

              <div className="w-full lg:w-[420px]">
                <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
                  <p className="text-sm font-semibold">Quick message (UI only)</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    This is just a UI form for now — backend will be connected later.
                  </p>

                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert("✅ Message UI submitted (backend not connected yet).");
                    }}
                  >
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-indigo-500/40
                                 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                      placeholder="Your name"
                    />
                    <input
                      type="email"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-indigo-500/40
                                 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                      placeholder="Email"
                    />
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none
                                 focus:ring-2 focus:ring-indigo-500/40
                                 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-100"
                      placeholder="Message"
                    />
                    <button
                      className="mt-1 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold
                                 bg-slate-900 text-white hover:bg-slate-800
                                 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition"
                    >
                      Send message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200/70 dark:border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
            <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white" />
                <div>
                  <p className="text-sm font-semibold">EduMentor</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Final Year Research Project • {year}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <a href="#modules" className="hover:text-slate-900 dark:hover:text-white transition">
                  Modules
                </a>
                <a href="#how" className="hover:text-slate-900 dark:hover:text-white transition">
                  How it works
                </a>
                <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition">
                  Features
                </a>
                <a href="#contact" className="hover:text-slate-900 dark:hover:text-white transition">
                  Contact
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Built with React (Vite) + Tailwind • Designed for a premium demo experience.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                © {year} EduMentor Team
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Smooth anchor scrolling */}
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
