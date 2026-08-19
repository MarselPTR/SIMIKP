import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { mockAuthLogin } from "./mock-api";

const AUTH_USER_STORAGE_KEY = "simikp.auth.user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const loggedInUser = await mockAuthLogin(email, password);
      setUser(loggedInUser);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Login gagal" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
