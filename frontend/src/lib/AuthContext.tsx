import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { mockAuthLogin } from "./mock-api";

// TODO(Dev 2): begitu POST /api/v1/auth/login, POST /api/v1/auth/logout, dan
// GET /api/v1/auth/me sudah nyata di backend (server-side session + HTTP-only
// cookie, bukan token), ganti login()/logout() di bawah untuk memanggil
// api-client.ts, dan tambahkan pengecekan sesi lewat GET /me saat app pertama
// kali dimuat. Sengaja TIDAK memakai localStorage untuk menyimpan user/token —
// pada arsitektur asli, cookie HTTP-only otomatis dikirim browser tanpa kode
// client yang menyimpannya sendiri, jadi user akan "hilang" saat refresh
// sampai pengecekan sesi lewat GET /me itu ada.

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const loggedInUser = await mockAuthLogin(email, password);
      setUser(loggedInUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Login gagal" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
