// client/src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Check if the user is logged in when the navbar loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/profile");
        // Automatically generate a default avatar using their name
        setUser({
          ...res.data,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.data.name}&backgroundColor=c0aede`,
        });
      } catch (err) {
        // If it fails (e.g., no cookie or expired), just leave user as null
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      setIsProfileDropdownOpen(false);
      navigate("/"); // Send them back to the home page
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-md shadow-indigo-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </Link>
            <div>
              <Link to="/" className="text-lg font-bold text-slate-900 leading-none">EduMentor</Link>
              <p className="text-[11px] font-medium text-slate-500">
                AI-powered learning suite
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="/#modules" className="hover:text-indigo-600 transition-colors">Modules</a>
            <a href="/#about" className="hover:text-indigo-600 transition-colors">About</a>
            <a href="/#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          {/* Desktop Actions (Auth vs Unauth) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-indigo-100 hover:border-indigo-300 transition-colors object-cover bg-slate-50"
                  />
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600">Profile / Settings</Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 mt-1 border-t border-slate-100"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="flex flex-col px-5 py-4 space-y-4">
            <a href="/#modules" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-700 hover:text-indigo-600">Modules</a>
            <a href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-700 hover:text-indigo-600">About</a>
            <a href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-semibold text-slate-700 hover:text-indigo-600">Contact</a>
          </nav>
          
          {/* Mobile Auth Section */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-slate-200 bg-white" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link 
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100"
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="flex-1 text-center rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100"
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link 
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl px-5 py-3 text-base font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center rounded-xl px-5 py-3 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/25"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}