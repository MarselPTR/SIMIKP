import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "./api-client";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
  staffType?: string | null;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // start loading true for /me check

  useEffect(() => {
    // Check session on mount
    apiFetch<{ success: boolean; user: AuthUser }>("/auth/me")
      .then((res) => {
        if (res.success) setUser(res.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || "Login gagal" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
