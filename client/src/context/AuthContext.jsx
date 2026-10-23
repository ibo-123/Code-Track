import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { getAvatarUrl } from "../services/userService";

const AuthContext = createContext(null);

const USER_KEY = "user";
const TOKEN_KEY = "token";

const normalizeUser = (raw) => {
  if (!raw) return null;
  const avatarPath = raw.avatar || raw.avater || raw.codeforcesAvatar || "";
  return {
    ...raw,
    id: raw.id || raw._id,
    name: raw.name || "",
    email: raw.email || "",
    avatar: avatarPath,
    avatarUrl: getAvatarUrl(avatarPath),
    codeforcesHandle: raw.codeforcesHandle || null,
    codeforcesRating: raw.codeforcesRating ?? null,
    codeforcesRank: raw.codeforcesRank || null,
    leetcodeUsername: raw.leetcodeUsername || null,
    leetcodeSolved:
      typeof raw.leetcodeSolved === "number" ? raw.leetcodeSolved : null,
  };
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUserState] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persistUser = useCallback((next) => {
    const normalized = normalizeUser(next);
    setUserState(normalized);
    if (normalized) {
      localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const saveToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, []);

  const login = useCallback(
    (newToken, userData) => {
      saveToken(newToken);
      persistUser(userData);
    },
    [saveToken, persistUser]
  );

  const updateUser = useCallback(
    ( partialOrUser) => {
      setUserState((prev) => {
        const merged = normalizeUser(
          typeof partialOrUser === "function"
            ? partialOrUser(prev)
            : { ...(prev || {}), ...partialOrUser }
        );
        if (merged) localStorage.setItem(USER_KEY, JSON.stringify(merged));
        return merged;
      });
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setLoading(false);
      return null;
    }

    try {
      const { data } = await api.get("/users/profile");
      const profile = data?.user || data;
      persistUser(profile);
      return profile;
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [persistUser, logout]);

  // Load fresh profile when a token exists
  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        saveToken,
        login,
        logout,
        updateUser,
        refreshUser,
        setUser: persistUser,
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

/** Safe during Vite HMR / prop-driven cards — returns null outside a provider. */
export function useAuthOptional() {
  return useContext(AuthContext);
}
