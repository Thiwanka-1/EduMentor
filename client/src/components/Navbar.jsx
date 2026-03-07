// client/src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

function NavItem({ to, children }) {
  return (
    <a
      href={to}
      className="relative rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-600"
    >
      {children}
    </a>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  const profileRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser({
          ...res.data,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            res.data.name || "User",
          )}&backgroundColor=c0aede`,
        });
      } catch (err) {
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(15,23,42,0.05)]">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-5 xl:px-6">
          <div className="flex h-18 items-center justify-between gap-4">
            {/* Left: Brand */}
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/"
                className="group flex items-center gap-3 rounded-2xl transition-transform duration-200 hover:scale-[1.01]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    />
                  </svg>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                    EduMentor
                  </p>
                  <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    AI-powered learning suite
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Nav */}
            <nav className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm md:flex">
              <NavItem to="/#modules">Modules</NavItem>
              <NavItem to="/#about">About</NavItem>
              <NavItem to="/#contact">Contact</NavItem>
            </nav>

            {/* Right: Desktop Actions */}
            <div className="hidden items-center gap-3 md:flex">
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                  >
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="h-10 w-10 rounded-full border-2 border-indigo-100 bg-slate-50 object-cover"
                    />
                    <div className="max-w-[140px] text-left">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Student account
                      </p>
                    </div>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
                      <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt="Profile"
                            className="h-12 w-12 rounded-full border-2 border-white bg-slate-50 object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                        >
                          <span>Profile / Settings</span>
                          <span>→</span>
                        </Link>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          <span>Log out</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-600"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-cyan-400"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-colors hover:text-indigo-600 md:hidden"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
            <div className="space-y-5 py-4">
              <nav className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                <a
                  href="/#modules"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                >
                  Modules
                </a>
                <a
                  href="/#about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                >
                  About
                </a>
                <a
                  href="/#contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                >
                  Contact
                </a>
              </nav>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="h-12 w-12 rounded-full border border-slate-200 bg-white object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
                      >
                        Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
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
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
                    >
                      Log in
                    </Link>

                    <Link
                      to="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-base font-bold text-white shadow-md shadow-indigo-500/25"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
