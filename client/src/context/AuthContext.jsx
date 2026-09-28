import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const applyUser = useCallback((nextUser) => {
    if (!nextUser) {
      setUser(null);
      localStorage.removeItem("user");
      return;
    }
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      clearSession();
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get("/auth/me");
      const nextUser = response.data?.user || null;
      applyUser(nextUser);
      return nextUser;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyUser, clearSession]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = localStorage.getItem("user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        localStorage.removeItem("user");
      }
    }

    refreshUser();
  }, [token, refreshUser]);

  const saveToken = (newToken, nextUser = null) => {
    if (!newToken) {
      clearSession();
      return;
    }

    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (nextUser) {
      applyUser(nextUser);
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        saveToken,
        setUser: applyUser,
        refreshUser,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
