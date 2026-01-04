import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  HelpCircle,
  Layers,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

export default function AceSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

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
      to: "/ace/weak-points",
    },
  ];

  return (
    <aside className="w-64 px-5 py-6 border-r border-black/5 dark:border-white/5
                      bg-white dark:bg-[#070b18] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400" />
        <div>
          <p className="font-semibold">ReinforceAI</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adaptive Engine v2.4
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 text-sm">
        {navItems.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== "/ace" &&
              location.pathname.startsWith(item.to));

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
      <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-500" />
          <div>
            <p className="text-sm font-medium">Alex Chen</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pro Plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
