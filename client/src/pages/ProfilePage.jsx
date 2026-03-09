// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, AlertTriangle, Loader2, Save, Trash2, Camera } from "lucide-react";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [avatar, setAvatar] = useState("");
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setFormData({ name: res.data.name, email: res.data.email, password: "" });
        setUserId(res.data._id);
        
        // Generate the exact same avatar as the Navbar
        setAvatar(
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            res.data.name || "User"
          )}&backgroundColor=c0aede`
        );
      } catch (err) {
        navigate("/login"); // Kick them out if not logged in
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: "Updating profile..." });
    
    try {
      // Create a payload that only includes the password if they typed a new one
      const payload = { name: formData.name, email: formData.email };
      if (formData.password) payload.password = formData.password;

      await api.put("/auth/profile", payload);
      setStatus({ type: "success", message: "Profile updated successfully!" });
      setFormData({ ...formData, password: "" }); // Clear the password field
      
      // Update avatar if name changed
      setAvatar(
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          formData.name || "User"
        )}&backgroundColor=c0aede`
      );
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.message || "Failed to update profile." });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) return;

    try {
      await api.delete(`/auth/users/${userId}`);
      await api.post("/auth/logout"); // Clear the cookie
      navigate("/");
    } catch (err) {
      setStatus({ type: "error", message: "Failed to delete account." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative overflow-hidden">
      <Navbar />
      
      {/* Light Theme Background Accents (Matching Landing Page) */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-100/50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-100/50 blur-[120px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto pt-32 px-6 pb-20">
        
        {/* Header & Avatar Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          {/* Avatar Profile Picture */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative w-28 h-28 rounded-full bg-white border-[3px] border-white shadow-xl overflow-hidden">
              <img 
                src={avatar} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover bg-slate-50"
              />
            </div>
            {/* Cute little decoration badge */}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="text-center md:text-left pt-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Account Settings</h1>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed">
              Manage your profile details, update your security preferences, and customize your EduMentor experience.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`mb-8 p-4 rounded-2xl border text-sm font-medium flex items-center gap-3 shadow-sm transition-all ${
            status.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
            status.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" :
            "bg-indigo-50 border-indigo-200 text-indigo-700"
          }`}>
            {status.type === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.type === "error" && <AlertTriangle className="w-4 h-4" />}
            {status.message}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Main Form Area */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-8 shadow-[0_8px_30px_rgb(15,23,42,0.04)]">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                Personal Information
              </h2>
              
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 placeholder-slate-400 font-medium transition-all shadow-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 placeholder-slate-400 font-medium transition-all shadow-sm"
                        placeholder="alex@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2 pt-6 border-t border-slate-100">
                  <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2 pt-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-cyan-600" />
                    </div>
                    Security
                  </h2>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">New Password (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 placeholder-slate-400 font-medium transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={status.type === "loading"}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {status.type === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Side Panel - Danger Zone */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl border border-rose-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(225,29,72,0.06)] relative overflow-hidden group">
              {/* Subtle red tint in the background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl group-hover:bg-rose-100 transition duration-500 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-lg font-extrabold text-rose-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}