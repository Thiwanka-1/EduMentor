import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Eye, EyeOff, GraduationCap } from "lucide-react";
import { registerUser, loginUser } from "../services/aceApi";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/ace";

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (mode === "register") {
        if (!name.trim()) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        res = await registerUser({ name, email, password });
      } else {
        res = await loginUser({ email, password });
      }

      login(res.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ════════════ LEFT PANEL — Branding ════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 right-16 w-64 h-64 rounded-full bg-cyan-300/15 blur-3xl animate-[float_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/2 left-1/3 w-36 h-36 rounded-full bg-violet-300/15 blur-2xl animate-[float_6s_ease-in-out_infinite_2s]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-lg">EduMentor</p>
              <p className="text-xs text-white/60">AI-Powered Learning</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Learn smarter,
              <br />
              study less.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Upload your study materials and let AI generate personalized
              quizzes, flashcards, and reinforcement sessions tailored to
              your weak points.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                "AI-generated quizzes from your materials",
                "Adaptive reinforcement for weak areas",
                "Track progress with detailed analytics",
                "Powered by local Ollama AI models",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-xs">✓</span>
                  </div>
                  <span className="text-sm text-white/80">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} EduMentor Team
          </p>
        </div>
      </div>

      {/* ════════════ RIGHT PANEL — Form ════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-lg">EduMentor</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-Powered Learning
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {mode === "login"
                ? "Enter your credentials to access your learning dashboard."
                : "Sign up to start generating AI quizzes from your study materials."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name — only for register */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10
                             bg-white dark:bg-[#070b18] text-sm outline-none
                             focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                             placeholder:text-slate-400 transition"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10
                           bg-white dark:bg-[#070b18] text-sm outline-none
                           focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                           placeholder:text-slate-400 transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10
                             bg-white dark:bg-[#070b18] text-sm outline-none
                             focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
                             placeholder:text-slate-400 transition pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                             hover:text-slate-600 dark:hover:text-slate-300 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {mode === "register" && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                         bg-gradient-to-r from-indigo-500 to-cyan-500 text-white
                         hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(null);
                }}
                className="ml-1.5 font-semibold text-indigo-500 hover:text-indigo-400 transition"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
