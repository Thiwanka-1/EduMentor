// client/src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../services/api";

export default function ProtectedRoute() {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If this request succeeds, the user has a valid HTTP-only cookie
        await api.get("/auth/profile");
        setIsAuth(true);
      } catch (err) {
        // If it fails (401 Unauthorized), they are not logged in
        setIsAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Show a clean loading spinner while checking the backend
  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
      </div>
    );
  }

  // If authenticated, render the protected child routes (<Outlet />)
  // If NOT authenticated, redirect immediately to the home page ("/")
  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
}