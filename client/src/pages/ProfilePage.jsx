// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Navbar />
      
      <div className="max-w-3xl mx-auto pt-32 px-5 sm:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Account Settings</h1>
        <p className="text-slate-500 mb-10">Manage your profile details and security preferences.</p>

        {status.message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
            status.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
            status.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" :
            "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            {status.message}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm p-6 sm:p-10 mb-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">New Password (Optional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={status.type === "loading"}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-cyan-400 transition-all disabled:opacity-70"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-rose-200 rounded-[24px] shadow-sm p-6 sm:p-10">
          <h2 className="text-xl font-bold text-rose-600 mb-2">Danger Zone</h2>
          <p className="text-slate-500 text-sm mb-6">Once you delete your account, there is no going back. Please be certain.</p>
          <button
            onClick={handleDeleteAccount}
            className="px-6 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  );
}