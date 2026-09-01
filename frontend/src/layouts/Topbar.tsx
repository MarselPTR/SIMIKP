import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, ChevronDown, MoreHorizontal, Globe } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useLanguage, type Language } from "../lib/LanguageContext";
import { useToast } from "../contexts/ToastContext";

const NAVY = "#0f1f5c";

interface TopbarProps {
  onMenuClick: () => void;
}

const ROLE_LABELS_ID: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
  petugas: "Petugas Lapangan",
};

const ROLE_LABELS_EN: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
  petugas: "Field Officer",
};

const getActivityFeed = (lang: Language) => [
  { id: "a1", text: lang === "en" ? 'Budi Santoso approved "SEO Article" content.' : 'Budi Santoso menyetujui konten "Artikel SEO".', time: lang === "en" ? "5 min ago" : "5 menit lalu" },
  { id: "a2", text: lang === "en" ? 'New activity "Tax Socialization" has been created.' : 'Kegiatan baru "Sosialisasi Pajak" telah dibuat.', time: lang === "en" ? "22 min ago" : "22 menit lalu" },
  { id: "a3", text: lang === "en" ? 'Dewi Lestari requested revision for "Landing Page Design".' : 'Dewi Lestari meminta revisi "Desain Landing Page".', time: lang === "en" ? "1 hour ago" : "1 jam lalu" },
  { id: "a4", text: lang === "en" ? 'Publication "Blog: React Guide" is now live.' : 'Publikasi "Blog: Panduan React" telah tayang.', time: lang === "en" ? "3 hours ago" : "3 jam lalu" },
];

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isPetugas = user?.role?.toLowerCase() === "petugas";
  const roleKey = user?.role?.toLowerCase() ?? "";
  const roleMap = language === "en" ? ROLE_LABELS_EN : ROLE_LABELS_ID;
  const roleLabel = roleMap[roleKey] ?? roleMap[user?.role ?? ""] ?? user?.role ?? (language === "en" ? "Field Officer" : "Petugas Lapangan");
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "US";

  const toggleLanguage = () => {
    const next: Language = language === "id" ? "en" : "id";
    setLanguage(next);
    addToast(next === "en" ? "Language switched to English" : "Bahasa diubah ke Bahasa Indonesia", "info");
  };

  const activityFeed = getActivityFeed(language);

  return (
    <header className="h-16 bg-white dark:bg-[#161b22] border-b border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2 px-6 sticky top-0 z-30 transition-colors">
      {/* Mobile hamburger */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 mr-auto" aria-label="Menu">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Quick Language Switcher Button */}
      <button
        type="button"
        onClick={toggleLanguage}
        title={language === "id" ? "Ganti ke Bahasa Inggris (Switch to English)" : "Switch to Indonesian (Ganti ke Bahasa Indonesia)"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-sky-500 transition-all cursor-pointer shadow-2xs"
      >
        <Globe className="w-3.5 h-3.5 text-[#0f1f5c] dark:text-sky-400" />
        <span className="tracking-wide">{language === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}</span>
      </button>

      {/* Help */}
      <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label={t("help")}>
        <HelpCircle className="w-5 h-5" strokeWidth={1.8} />
      </button>

      {/* Notification bell */}
      <div className="relative">
        <button type="button" onClick={() => { setShowActivity((v) => !v); setShowProfile(false); }} className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label={t("notifications")}>
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#161b22]" />
        </button>

        {showActivity && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1c2128] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.8} />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{language === "en" ? "Activity Feed" : "Aktivitas Terbaru"}</h4>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Opsi lainnya">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
              {activityFeed.map((item) => (
                <div key={item.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.text}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User profile */}
      <div className="relative ml-1 flex items-center">
        {/* Tombol Nama & Avatar: Langsung masuk ke Halaman Profil */}
        <button
          type="button"
          onClick={() => {
            setShowProfile(false);
            navigate(isPetugas ? "/petugas/profil" : "/profil");
          }}
          title={t("profile")}
          className="flex items-center gap-2 rounded-lg pl-3 pr-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer group"
        >
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0f1f5c] dark:group-hover:text-sky-400 transition">
              {user?.name ?? roleLabel}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {language === "en" ? "Batu City Government Diskominfo" : "Diskominfo Pemerintah Kota Batu"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition">
            {initials}
          </div>
        </button>

        {/* Tombol Chevron Panah: Buka Dropdown Opsi */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowProfile((v) => !v);
            setShowActivity(false);
          }}
          title={t("settings")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1c2128] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50">
            {/* Header Profil dalam Dropdown: Klik langsung ke Profil */}
            <div
              onClick={() => {
                setShowProfile(false);
                navigate(isPetugas ? "/petugas/profil" : "/profil");
              }}
              className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#0f1f5c] transition">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.username ?? ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${NAVY}15`, color: NAVY }}>
                  {roleLabel}
                </span>
                {user?.staffType && (
                  <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {user.staffType}
                  </span>
                )}
              </div>
            </div>

            <div className="py-1 border-b border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate(isPetugas ? "/petugas/profil" : "/profil");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                {t("profile")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate(isPetugas ? "/petugas/pengaturan" : "/pengaturan");
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                {t("settings")}
              </button>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer font-medium"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
