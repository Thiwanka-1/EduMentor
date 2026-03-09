import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  HelpCircle,
  Layers,
  AlertTriangle,
  BarChart3,
  History,
  Home,
  User as UserIcon,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

export default function AceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <aside className="w-64 px-5 py-6 border-r border-slate-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-sm" />
        <div>
          <p className="font-bold text-slate-900">ReinforceAI</p>
          <p className="text-xs text-slate-500">Adaptive Engine</p>
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition
                ${
                  active
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {item.icon}
              {item.label}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="mt-auto pt-6 border-t border-slate-200">
        <div className="flex items-center gap-3">
          {/* Profile + Home */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/profile")}
              title="Profile"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
            >
              <UserIcon size={16} />
            </button>
            <button
              onClick={() => navigate("/")}
              title="Home"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
            >
              <Home size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
