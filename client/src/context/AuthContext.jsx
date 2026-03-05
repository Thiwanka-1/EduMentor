// ──────────────────────────────────────────────────────────────
// Auth Context — Global authentication state management
// ──────────────────────────────────────────────────────────────
import { createContext, useState, useEffect } from "react";
import { getProfile, logoutUser, isAuthenticated } from "../services/aceApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if user is already logged in (token exists)
  useEffect(() => {
    async function loadUser() {
      if (isAuthenticated()) {
        try {
          const res = await getProfile();
          setUser(res.user);
        } catch (err) {
          console.error("Failed to load user profile:", err);
          // Token might be expired — clear it
          logoutUser();
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  function login(userData) {
    setUser(userData);
  }

  function logout() {
    logoutUser();
    setUser(null);
  }

  function updateUser(userData) {
    setUser((prev) => ({ ...prev, ...userData }));
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, isLoggedIn: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
