// client/src/pages/Home.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

function Icon({ children, className = "" }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm text-lg font-bold " +
        className
      }
    >
      {children}
    </span>
  );
}

function ModuleCard({ title, desc, tag, accent = "indigo", to }) {
  const navigate = useNavigate();

  const accentStyles = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    violet: "bg-violet-50 text-violet-600 border-violet-200",
  }[accent];

  return (
    <div
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 md:p-8
                 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Icon className={accentStyles}>{title[0]}</Icon>
          <span className="rounded-full px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
            {tag}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm leading-relaxed text-slate-600 mb-6 min-h-[60px]">
            {desc}
          </p>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-indigo-600 transition-colors"
            type="button"
            onClick={() => {
              if (to) navigate(to);
            }}
          >
            Open Module
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />

      {/* Futuristic Background Gradients (Full Width) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
      </div>

      <main className="relative z-10 pt-28">
        {/* Hero Section */}
        <section className="w-full px-3 sm:px-4 lg:px-5 xl:px-6 pt-12 lg:pt-20 pb-16">
          <div className="mx-auto max-w-screen-2xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Learn faster with a{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  futuristic AI mentor.
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 max-w-xl font-medium">
                EduMentor combines a StudyBuddy Agent, Multi-View Explanations,
                a 3D Avatar Tutor, and an Adaptive Reinforcement Engine—built to
                guide university students from confusion to mastery.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="#modules"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1"
                >
                  View modules →
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                >
                  What is EduMentor?
                </a>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
                {[
                  { k: "4", v: "Modules" },
                  { k: "Multi-View", v: "Explain" },
                  { k: "Adaptive", v: "Reinforce" },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center"
                  >
                    <p className="text-2xl font-black text-slate-900">{s.k}</p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual Image / Video Wrapper */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-20 blur-2xl rounded-[40px] animate-[float_8s_ease-in-out_infinite]" />
              <div className="relative overflow-hidden rounded-[32px] border-4 border-white bg-white shadow-2xl shadow-indigo-900/10">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Live UI Preview
                  </span>
                </div>

                {/* Replace src with your actual video or image path */}
                <video
                  src="/demo.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto object-cover aspect-video bg-slate-100"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section
          id="modules"
          className="w-full bg-white border-y border-slate-200 py-20 px-3 sm:px-4 lg:px-5 xl:px-6"
        >
          <div className="mx-auto max-w-screen-2xl">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold tracking-[0.2em] uppercase text-indigo-600 mb-3">
                Core Modules
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                One platform, four powerful engines
              </h2>
              <p className="text-lg text-slate-600">
                Consistent UI, shared theme, and scalable structure. Ready to
                connect to the backend.
              </p>
            </div>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModuleCard
                accent="cyan"
                title="StudyBuddy Agent"
                tag="Guided Q&A"
                desc="Ask questions on your lecture content and get structured help and next steps."
                to="/study-buddy"
              />
              <ModuleCard
                accent="indigo"
                title="Multi-View Explanation"
                tag="4 Views"
                desc="Simple • Analogy • Code • Summary explanations to match different learners."
                to="/mveg/explain"
              />
              <ModuleCard
                accent="violet"
                title="3D Avatar Tutor"
                tag="Interactive"
                desc="A future-ready tutor interface for speech + expressions and better engagement."
                to="/lesson"
              />
              <ModuleCard
                accent="teal"
                title="ACE Reinforcement"
                tag="Mastery"
                desc="Adaptive reinforcement sessions, quizzes, and mastery tracking for retention."
                to="/ace"
              />
            </div>
          </div>
        </section>

        {/* About & Contact Section */}
        <section
          id="about"
          className="w-full px-3 sm:px-4 lg:px-5 xl:px-6 py-20"
        >
          <div className="mx-auto max-w-screen-2xl grid md:grid-cols-2 gap-8">
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
              <p className="text-sm font-extrabold tracking-[0.2em] uppercase text-indigo-600 mb-3">
                About
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                Built for real student pain points
              </h3>
              <p className="text-lg text-slate-600 leading-relaxed">
                EduMentor is a research-driven learning platform focused on
                clarity, personalization, and retention. The design aims to be
                demo-friendly (PP1) while staying scalable for full integration
                later.
              </p>
            </div>

            <div
              id="contact"
              className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-indigo-900 to-slate-900 p-10 shadow-xl shadow-indigo-900/20 text-white"
            >
              <p className="text-sm font-extrabold tracking-[0.2em] uppercase text-cyan-400 mb-3">
                Contact
              </p>
              <h3 className="text-3xl font-extrabold mb-4">
                Need a prototype review?
              </h3>
              <p className="text-lg text-indigo-200 mb-8">
                Email us anytime to schedule a demo or discuss integration
                details.
              </p>
              <a
                href="mailto:edumentor.team@gmail.com"
                className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl px-8 py-4 text-base font-bold text-slate-900 bg-white hover:bg-cyan-50 transition-colors shadow-lg"
              >
                edumentor.team@gmail.com →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-5 xl:px-6 py-10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400" />
            <p className="text-lg font-bold text-slate-900">EduMentor</p>
          </div>
          <p className="text-sm font-medium text-slate-500">
            © {year} EduMentor Team • React + Vite + Tailwind
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
