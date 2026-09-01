import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { Role } from "../../lib/mock-data";
import logoKotaBatu from "../../assets/Logo_Kota_Batu.png";
import { useLanguage } from "../../lib/LanguageContext";
import { 
  Globe, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HelpCircle,
  X
} from "lucide-react";

const LoginPage = () => {
  const { login, loading, isAuthenticated, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);

  if (isAuthenticated && user) {
    const destination = user.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error ?? t("login_failed"));
      return;
    }
    const destination = result.user?.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard";
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen flex relative bg-gray-50 dark:bg-[#0d1117]">
      {/* Quick Language Switcher floating top right */}
      <div className="absolute top-5 right-5 z-50">
        <button
          type="button"
          onClick={() => setLanguage(language === "id" ? "en" : "id")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-sm cursor-pointer transition active:scale-95"
          title="Switch Language"
        >
          <Globe className="w-4 h-4 text-[#0f1f5c] dark:text-sky-400" />
          <span>{language === "id" ? "🇮🇩 Bahasa Indonesia" : "🇬🇧 English"}</span>
        </button>
      </div>

      {/* ── Left panel – centered logo with modern navy gradient ── */}
      <div
        className="hidden md:flex flex-col items-center justify-center flex-1 px-12 relative overflow-hidden text-white"
        style={{
          background: "linear-gradient(135deg, #091338 0%, #0f1f5c 50%, #173282 100%)",
        }}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <img
            src={logoKotaBatu}
            alt="Logo Kota Batu"
            className="w-44 h-auto mb-8 drop-shadow-2xl transition hover:scale-105 duration-300"
          />

          <h1 className="text-3xl font-extrabold text-white text-center leading-snug tracking-tight">
            SIMIKP Kota Batu
          </h1>

          <p className="mt-4 text-blue-100 text-center text-base leading-relaxed">
            {language === "en"
              ? "Public Information and Communication Management Information System"
              : "Sistem Informasi Manajemen Informasi dan Komunikasi Publik"}
          </p>

          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-blue-300">
            {t("login_hero_tagline")}
          </p>
        </div>
      </div>

      {/* ── Right panel – Form Container ── */}
      <div className="w-full lg:w-[500px] xl:w-[540px] flex flex-col justify-center px-8 sm:px-14 py-16 bg-white dark:bg-[#161b22] text-gray-900 dark:text-gray-100 shadow-xl lg:shadow-none">
        {/* Mobile Header with Logo */}
        <div className="flex flex-col items-center lg:hidden mb-8 text-center">
          <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-20 h-auto mb-3 drop-shadow" />
          <h2 className="text-2xl font-black text-[#0f1f5c] dark:text-white">SIMIKP Kota Batu</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">{t("login_hero_tagline")}</p>
        </div>

        {/* Form Title */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400">
            {t("login_welcome")}
          </span>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            {t("login_title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 leading-relaxed">
            {t("login_subtitle")}
          </p>
        </div>

        {/* Form Element */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username / Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              {t("login_username")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("login_username_placeholder")}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500 focus:bg-white dark:focus:bg-[#0d1117] transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
              {t("login_password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login_password_placeholder")}
                required
                className="w-full pl-10 pr-11 py-3 border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-sky-500 focus:bg-white dark:focus:bg-[#0d1117] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Forgot password */}
          <div className="flex items-center justify-end -mt-1">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-semibold text-blue-700 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t("login_forgot_password")}</span>
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.99] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-[#0f1f5c] to-[#1a3285] hover:from-[#0a1645] hover:to-[#132669] cursor-pointer"
          >
            {loading ? t("login_submitting") : t("login_submit_btn")}
          </button>
        </form>

        {/* Security / Organization Badge at Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t("login_footer_secured")}</span>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-sky-400 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("login_forgot_password")}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
              {t("login_forgot_password_info")}
            </p>

            <div className="mt-5 p-3.5 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-900 dark:text-gray-200">Kontak Admin IKP:</p>
              <p>🏢 Diskominfo Balai Kota Among Tani, Kota Batu</p>
              <p>✉️ diskominfo@batukota.go.id</p>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="mt-6 w-full py-2.5 bg-[#0f1f5c] hover:bg-[#0a1645] text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
