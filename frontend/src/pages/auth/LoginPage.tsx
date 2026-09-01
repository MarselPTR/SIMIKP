import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { Role } from "../../lib/mock-data";
import logoKotaBatu from "../../assets/Logo_Kota_Batu.png";
import { useLanguage } from "../../lib/LanguageContext";
import { Globe } from "lucide-react";

const LoginPage = () => {
  const { login, loading, isAuthenticated, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated && user) {
    const destination = user.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error ?? (language === "en" ? "Login failed" : "Login gagal"));
      return;
    }
    const destination = result.user?.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard";
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Quick Language Switcher floating top right */}
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setLanguage(language === "id" ? "en" : "id")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#0f1f5c] dark:text-sky-400" />
          <span>{language === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}</span>
        </button>
      </div>

      {/* ── Left panel – navy background ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 px-12"
        style={{ backgroundColor: "#0f1f5c" }}
      >
        <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-44 h-auto mb-8 drop-shadow-lg" />

        <h1 className="text-3xl font-bold text-white text-center leading-snug">SIMIKP Kota Batu</h1>
        <p className="mt-4 text-blue-200 text-center text-base leading-relaxed max-w-sm">
          {language === "en"
            ? "Public Information and Communication Management Information System"
            : "Sistem Informasi Manajemen Informasi dan Komunikasi Publik"}
        </p>
      </div>

      {/* ── Right panel – white form ── */}
      <div className="w-full md:w-[420px] lg:w-[480px] flex flex-col justify-center px-10 py-16 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100">
        {/* Mobile: show logo on top */}
        <div className="flex md:hidden justify-center mb-8">
          <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-24 h-auto" />
        </div>

        <h2 className="text-3xl font-bold mb-1 text-[#1a2a6c] dark:text-sky-400">
          {t("login_title")}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t("login_subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email/Username */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
              {t("login_username")}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login_username_placeholder")}
              required
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a2a6c";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,42,108,0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
              {t("login_password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 rounded-md px-4 py-2.5 text-sm focus:outline-none transition"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a2a6c";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(26,42,108,0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-rose-950/50 rounded-md px-3 py-2">{error}</p>}

          {/* Forgot password */}
          <div className="text-right -mt-2">
            <button type="button" className="text-sm font-medium hover:underline text-[#1a2a6c] dark:text-sky-400 cursor-pointer">
              {t("login_forgot_password")}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed bg-[#1a2a6c] dark:bg-blue-600 cursor-pointer"
          >
            {loading ? (language === "en" ? "Processing..." : "Memproses...") : t("login_submit_btn")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
