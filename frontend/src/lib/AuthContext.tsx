import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "./api-client";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
  staffType?: string | null;
  avatar?: string | null;
  phone?: string | null;
  nip?: string | null;
  bio?: string | null;
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
  updateUser: (updatedData: Partial<AuthUser>) => void;
}

const AuthContext = ((globalThis as unknown as { __SIMIKP_AUTH_CTX__?: React.Context<AuthContextValue | null> })
  .__SIMIKP_AUTH_CTX__ ??= createContext<AuthContextValue | null>(null));

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    try {
      const savedUser = localStorage.getItem("simikp_user");
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      return {
        user: parsedUser,
        loading: false,
        isAuthenticated: parsedUser !== null,
        login: async () => ({ success: false, error: "AuthProvider belum siap" }),
        logout: async () => {
          localStorage.removeItem("simikp_user");
        },
        updateUser: async (data) => {
          if (parsedUser) {
            const next = { ...parsedUser, ...data };
            localStorage.setItem("simikp_user", JSON.stringify(next));
            try {
              await apiFetch("/users/profile", {
                method: "PUT",
                body: JSON.stringify({
                  id: parsedUser.id,
                  username: parsedUser.username,
                  name: data.name,
                  phone: data.phone,
                  bio: data.bio,
                  avatar: data.avatar,
                  staffType: data.staffType,
                }),
              });
            } catch {}
          }
        },
      };
    } catch {
      return {
        user: null,
        loading: false,
        isAuthenticated: false,
        login: async () => ({ success: false, error: "AuthProvider belum siap" }),
        logout: async () => {},
        updateUser: () => {},
      };
    }
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Inisialisasi user dari localStorage agar UI cepat tampil jika ada cache
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem("simikp_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount via API /auth/me
    apiFetch<{ success: boolean; user: AuthUser }>("/auth/me")
      .then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem("simikp_user", JSON.stringify(res.user));
        }
      })
      .catch(() => {
        localStorage.removeItem("simikp_user");
        localStorage.removeItem("simikp_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; user: AuthUser; token?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(res.user);
      localStorage.setItem("simikp_user", JSON.stringify(res.user));
      if (res.token) {
        localStorage.setItem("simikp_token", res.token);
      }
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || "Username atau password salah" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST", body: "{}" });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      localStorage.removeItem("simikp_user");
      localStorage.removeItem("simikp_token");
    }
  };

  const updateUser = async (updatedData: Partial<AuthUser>) => {
    let nextUser: AuthUser | null = null;
    setUser((prev) => {
      if (!prev) return null;
      nextUser = { ...prev, ...updatedData };
      localStorage.setItem("simikp_user", JSON.stringify(nextUser));
      return nextUser;
    });

    try {
      await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          id: user?.id,
          username: user?.username,
          name: updatedData.name,
          phone: updatedData.phone,
          bio: updatedData.bio,
          avatar: updatedData.avatar,
          staffType: updatedData.staffType,
        }),
      });
    } catch (err) {
      console.warn("[AuthContext] Gagal sync profil ke backend:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
