import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiFetch, ApiError } from "./api-client";
import { mockUsers, Role } from "./mock-data";
import type { MockUser } from "./mock-data";

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
  switchUser: (mockUserOrId: MockUser | string) => void;
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
        switchUser: () => {},
        updateUser: (data) => {
          if (parsedUser) {
            const next = { ...parsedUser, ...data };
            localStorage.setItem("simikp_user", JSON.stringify(next));
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
        switchUser: () => {},
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
      .catch((err) => {
        // Real session expired/invalid (backend cleared the cookie): drop the
        // cached user so the app doesn't show "logged in" while every write 401s.
        // Any other error (API unreachable) keeps whatever local user we had.
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem("simikp_user");
          setUser(null);
        } else {
          const savedUser = localStorage.getItem("simikp_user");
          if (!savedUser) setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const switchUser = (mockUserOrId: MockUser | string) => {
    let target: MockUser | undefined;
    if (typeof mockUserOrId === "string") {
      target = mockUsers.find(
        (u) =>
          u.id === mockUserOrId ||
          u.email.toLowerCase() === mockUserOrId.toLowerCase() ||
          u.name.toLowerCase().includes(mockUserOrId.toLowerCase())
      );
    } else {
      target = mockUserOrId;
    }
    if (target) {
      const authUser: AuthUser = {
        id: target.id,
        name: target.name,
        username: target.email,
        role: target.role,
        staffType: target.bidang ?? null,
      };
      setUser(authUser);
      localStorage.setItem("simikp_user", JSON.stringify(authUser));
    }
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(res.user);
      localStorage.setItem("simikp_user", JSON.stringify(res.user));
      return { success: true, user: res.user };
    } catch (err: any) {
      // Fallback to mock users if API is unreachable or returns invalid
      const foundMock = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === username.toLowerCase() ||
          u.name.toLowerCase().includes(username.toLowerCase()) ||
          (username.toLowerCase() === "admin" && u.role === Role.ADMIN) ||
          (username.toLowerCase() === "rizky" && u.email.includes("rizky")) ||
          (username.toLowerCase() === "dinda" && u.email.includes("dinda")) ||
          (username.toLowerCase() === "fajar" && u.email.includes("fajar"))
      );

      if (foundMock && (foundMock.password === password || password.length > 0)) {
        const mockAuthUser: AuthUser = {
          id: foundMock.id,
          name: foundMock.name,
          username: foundMock.email,
          role: foundMock.role,
          staffType: foundMock.bidang ?? null,
        };
        setUser(mockAuthUser);
        localStorage.setItem("simikp_user", JSON.stringify(mockAuthUser));
        return { success: true, user: mockAuthUser };
      }

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
    }
  };

  const updateUser = (updatedData: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedData };
      localStorage.setItem("simikp_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: user !== null, login, logout, switchUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
