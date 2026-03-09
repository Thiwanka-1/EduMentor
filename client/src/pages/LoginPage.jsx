// client/src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import useAuth from "../hooks/useAuth"; // ✅ 1. Import useAuth hook

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); // ✅ 2. Get the login function from context

  const from = location.state?.from || "/"; // Default route after login

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Basic Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // The backend will automatically set the HTTP-only cookie
      const res = await api.post("/auth/login", formData);
      console.log("Logged in:", res.data);

      // ✅ 3. Update the AuthContext and set the local flag!
      localStorage.setItem("edumentor_is_logged_in", "true"); // Fallback flag for page reloads
      login(res.data); // Update global state
      
      // ✅ 4. Navigate to the dashboard
      navigate(from, { replace: true }); 

    } catch (err) {
      setServerError(err.response?.data?.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* Left Side - Brand / Visual (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
          </div>
          <span className="text-xl font-bold tracking-tight">EduMentor</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.1] mb-6">Learn smarter,<br/>study less.</h1>
          <p className="text-lg text-indigo-100 mb-8">
            Upload your study materials and let AI generate personalized quizzes, flashcards, and reinforcement sessions tailored to your weak points.
          </p>
          <ul className="space-y-4 text-sm font-medium text-indigo-50">
            <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">✓</span> AI-generated quizzes from your materials</li>
            <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">✓</span> Adaptive reinforcement for weak areas</li>
            <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20">✓</span> Track progress with detailed analytics</li>
          </ul>
        </div>

        <div className="relative z-10 text-sm text-indigo-200">
          © {new Date().getFullYear()} EduMentor Team
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Enter your credentials to access your learning dashboard.</p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2">
              ⚠️ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors`}
                placeholder="alex@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-cyan-400 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 font-medium">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors">
              Sign up
            </Link>
          </p>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}