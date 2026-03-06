import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  HelpCircle,
  Layers,
  AlertTriangle,
  BarChart3,
  History,
  LogOut,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

export default function AceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      to: "/ace",
    },
    {
      label: "Questions",
      icon: <HelpCircle size={18} />,
      to: "/ace/create",
    },
    {
      label: "Flashcards",
      icon: <Layers size={18} />,
      to: "/ace/flashcards",
    },
    {
      label: "Analysis",
      icon: <BarChart3 size={18} />,
      to: "/ace/analysis",
    },
    {
      label: "Weak Points",
      icon: <AlertTriangle size={18} />,
      to: "/ace/reinforce",
    },
    {
      label: "Quiz History",
      icon: <History size={18} />,
      to: "/ace/history",
    },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Get initials for avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <aside
      className="w-64 px-5 py-6 border-r border-slate-200/70 dark:border-white/5
                      bg-white dark:bg-[#070b18] flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400" />
        <div>
          <p className="font-semibold">ReinforceAI</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adaptive Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 text-sm">
        {navItems.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== "/ace" && location.pathname.startsWith(item.to));

          return (
            <div
              key={item.label}
              onClick={() => navigate(item.to)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
                ${
                  active
                    ? "bg-indigo-600/15 text-indigo-500"
                    : "text-slate-500 hover:text-black dark:hover:text-white"
                }`}
            >
              {item.icon}
              {item.label}
            </div>
            );
        })}
      </nav>

      {/* User */}
      <div className="mt-auto pt-6 border-t border-slate-200/70 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500
                        flex items-center justify-center text-white text-xs font-bold"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email || ""}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-slate-500 hover:text-red-400 transition shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
    );
}
