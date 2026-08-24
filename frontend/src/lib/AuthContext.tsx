import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { mockAuthLogin } from "./mock-api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  // Hanya diisi untuk role petugas — dipakai untuk filter tugas lapangan per bidang.
  bidang?: string;
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
  // Inisialisasi user dari localStorage agar sesi tidak hilang saat browser di-refresh
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem("simikp_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const loggedInUser = await mockAuthLogin(email, password);
      setUser(loggedInUser);
      try {
        localStorage.setItem("simikp_user", JSON.stringify(loggedInUser));
      } catch (err) {
        console.error("Failed to save user to localStorage", err);
      }
      return { success: true, user: loggedInUser };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Login gagal" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("simikp_user");
    } catch (err) {
      console.error("Failed to remove user from localStorage", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
