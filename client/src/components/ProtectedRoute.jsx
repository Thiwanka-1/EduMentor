// ──────────────────────────────────────────────────────────────
// ProtectedRoute — Redirects to login if not authenticated
// ──────────────────────────────────────────────────────────────
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login with return path
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
