import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  User,
  Bell,
  Palette,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  Moon,
  Sun,
  Shield,
  HelpCircle,
  Globe,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";
import type { Language } from "../../lib/LanguageContext";
import { apiFetch } from "../../lib/api-client";

const NAVY = "#0f1f5c";

export default function PengaturanPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState("keamanan");

  // ── Keamanan / Password States ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isSavingPw, setIsSavingPw] = useState(false);

  // ── Profil / Data States ──
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "0812-3456-7890");
  const [staffType, setStaffType] = useState(user?.staffType ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Notifikasi States ──
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(true);
  const [notifSound, setNotifSound] = useState(true);

  const tabs = [
    { id: "keamanan", label: t("tab_security"), icon: KeyRound, desc: t("tab_security_desc") },
    { id: "profil", label: t("tab_profile"), icon: User, desc: t("tab_profile_desc") },
    { id: "notifikasi", label: t("tab_notif"), icon: Bell, desc: t("tab_notif_desc") },
    { id: "tampilan", label: t("tab_appearance"), icon: Palette, desc: t("tab_appearance_desc") },
  ];

  // Password strength calculator
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: language === "en" ? "Not set" : "Belum diisi", color: "bg-gray-200" };
    if (pw.length < 6) return { score: 1, label: language === "en" ? "Too Short (Min. 6 Characters)" : "Terlalu Pendek (Min. 6 Karakter)", color: "bg-rose-500" };
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pw);

    if (pw.length >= 8 && hasLetter && hasNumber && hasSpecial) {
      return { score: 4, label: language === "en" ? "Very Strong" : "Sangat Kuat", color: "bg-emerald-500" };
    }
    if (pw.length >= 6 && hasLetter && hasNumber) {
      return { score: 3, label: language === "en" ? "Strong" : "Kuat", color: "bg-emerald-400" };
    }
    return { score: 2, label: language === "en" ? "Moderate" : "Sedang", color: "bg-amber-400" };
  };

  const pwStrength = getPasswordStrength(newPassword);

  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast(t("password_current_error"), "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast(t("password_length_error"), "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast(t("password_match_error"), "error");
      return;
    }

    setIsSavingPw(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          userId: user?.id,
          username: user?.username,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast(res.message || t("password_saved_success"), "success");
    } catch (err: any) {
      addToast(err.message || "Gagal memperbarui kata sandi. Pastikan kata sandi saat ini benar.", "error");
    } finally {
      setIsSavingPw(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast(language === "en" ? "Full name cannot be empty." : "Nama lengkap tidak boleh kosong.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUser({
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim(),
        staffType,
      });
      addToast(t("profile_saved_success"), "success");
    } catch (err: any) {
      addToast(err.message || "Gagal menyimpan perubahan profil", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isPetugas = user?.role?.toLowerCase() === "petugas";

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6 animate-fade-in">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(isPetugas ? "/petugas/profil" : "/profil")}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0f1f5c] dark:hover:text-white transition px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" strokeWidth={2.2} />
          <span>{t("back_to_profile")}</span>
        </button>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <select
            value={language}
            onChange={(e) => {
              const next = e.target.value as Language;
              setLanguage(next);
              addToast(next === "en" ? "Language switched to English" : "Bahasa diubah ke Bahasa Indonesia", "info");
            }}
            className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="id">🇮🇩 ID (Bahasa Indonesia)</option>
            <option value="en">🇬🇧 EN (English)</option>
          </select>
        </div>
      </div>

      {/* ── Header Title Card ── */}
      <div className="bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight" style={{ color: isDark ? undefined : NAVY }}>
              {t("settings_title")}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("settings_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t("verified_account")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Sidebar Tabs + Content Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Tabs (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-800 p-2 shadow-xs space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition text-left cursor-pointer ${
                    isActive
                      ? "bg-[#0f1f5c] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? "bg-white/15 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{tab.label}</p>
                    <p className={`text-[11px] truncate mt-0.5 ${isActive ? "text-slate-200" : "text-gray-400 dark:text-gray-500"}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Help Box */}
          <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
              <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs font-bold">{t("need_help_title")}</p>
            </div>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
              {t("need_help_desc")}
            </p>
          </div>
        </div>

        {/* Tab Content Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161b22] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-7 shadow-xs">
          {/* ════════════════════ TAB 1: KEAMANAN & PASSWORD ════════════════════ */}
          {activeTab === "keamanan" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {t("change_password")}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t("change_password_desc")}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("current_password")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("current_password_ph")}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("new_password")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("new_password_ph")}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">{t("password_strength")}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{pwStrength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pwStrength.color} transition-all duration-300`}
                          style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("confirm_new_password")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("confirm_new_password_ph")}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c] dark:focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">
                      {t("password_match_error")}
                    </p>
                  )}
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingPw}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
                    style={{ backgroundColor: NAVY }}
                  >
                    {isSavingPw ? (
                      <span>{t("saving")}</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{t("save_new_password")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Badge */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {language === "en"
                    ? "Your password is encrypted with modern high-security standards compliant with SIMIKP protocols."
                    : "Sandi Anda dienkripsi dengan standar keamanan tinggi sesuai protokol SIMIKP Kota Batu."}
                </span>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 2: PROFIL & DATA PRIBADI ════════════════════ */}
          {activeTab === "profil" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {t("edit_profile")}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t("edit_profile_desc")}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("full_name_label")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rizky Pratama, S.I.Kom"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]"
                    />
                  </div>
                </div>

                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("username_email")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="user@petugas.simikp.com"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]"
                    />
                  </div>
                </div>

                {/* Nomor Telepon / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("wa_phone_label")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]"
                    />
                  </div>
                </div>

                {/* Sektor Bidang Tugas (Khusus Petugas) */}
                {isPetugas && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("sector_task_label")}
                    </label>
                    <select
                      value={staffType}
                      onChange={(e) => setStaffType(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]"
                    >
                      <option value="">{language === "en" ? "Not set" : "Belum ditentukan"}</option>
                      <option value="PRAHUM">Pranata Humas (PRAHUM)</option>
                      <option value="FOTO_VIDEO">{language === "en" ? "Photographer & Videographer" : "Fotografer & Videografer"}</option>
                      <option value="DESAINER_EDITOR">{language === "en" ? "Designer & Editor" : "Desainer & Editor"}</option>
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {t("sector_filter_desc")}
                    </p>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
                    style={{ backgroundColor: NAVY }}
                  >
                    {isSavingProfile ? (
                      <span>{t("saving")}</span>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{t("save_changes")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ════════════════════ TAB 3: PREFERENSI NOTIFIKASI ════════════════════ */}
          {activeTab === "notifikasi" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {t("notif_preferences")}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t("notif_preferences_desc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Notif Email */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {t("notif_email_title")}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t("notif_email_desc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifEmail((v) => !v);
                      addToast(language === "en" ? "Email notification preferences updated" : "Preferensi notifikasi email diperbarui", "info");
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      notifEmail ? "bg-[#0f1f5c]" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                        notifEmail ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Notif Browser */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {t("notif_browser_title")}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t("notif_browser_desc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifBrowser((v) => !v);
                      addToast(language === "en" ? "Browser notification preferences updated" : "Preferensi notifikasi browser diperbarui", "info");
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      notifBrowser ? "bg-[#0f1f5c]" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                        notifBrowser ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Notif Audio / Suara */}
                <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {t("notif_sound_title")}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {t("notif_sound_desc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifSound((v) => !v);
                      addToast(language === "en" ? "Sound alert preferences updated" : "Preferensi suara notifikasi diperbarui", "info");
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      notifSound ? "bg-[#0f1f5c]" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                        notifSound ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 4: TAMPILAN & TEMA ════════════════════ */}
          {activeTab === "tampilan" && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {t("appearance_lang_title")}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t("appearance_lang_desc")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                    {t("color_theme_mode")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Light */}
                    <div
                      onClick={() => {
                        setTheme("light");
                        addToast(language === "en" ? "Light Mode activated" : "Mode Terang diaktifkan", "info");
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer text-center space-y-3 ${
                        theme === "light"
                          ? "border-[#0f1f5c] bg-blue-50/50 shadow-md ring-2 ring-[#0f1f5c]/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                        <Sun className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("light_mode")}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("light_mode_desc")}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                        theme === "light" ? "bg-[#0f1f5c] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}>
                        {theme === "light" ? t("active_now") : t("choose_mode")}
                      </span>
                    </div>

                    {/* Dark */}
                    <div
                      onClick={() => {
                        setTheme("dark");
                        addToast(language === "en" ? "Dark Mode activated" : "Mode Gelap diaktifkan", "info");
                      }}
                      className={`p-5 rounded-2xl border-2 transition cursor-pointer text-center space-y-3 ${
                        theme === "dark"
                          ? "border-sky-500 bg-slate-900 shadow-md ring-2 ring-sky-500/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-sky-400 flex items-center justify-center mx-auto shadow-xs border border-slate-700">
                        <Moon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("dark_mode")}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("dark_mode_desc")}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                        theme === "dark" ? "bg-sky-500 text-slate-950 font-extrabold" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}>
                        {theme === "dark" ? t("active_now") : t("choose_mode")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Language Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("interface_lang")}
                  </label>
                  <select
                    value={language}
                    onChange={(e) => {
                      const next = e.target.value as Language;
                      setLanguage(next);
                      addToast(next === "en" ? "Language switched to English" : "Bahasa diubah ke Bahasa Indonesia", "info");
                    }}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0f1f5c]"
                  >
                    <option value="id">🇮🇩 Bahasa Indonesia (Resmi Pemerintah Kota Batu)</option>
                    <option value="en">🇬🇧 English (International Standard)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
