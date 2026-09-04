import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, ChevronDown, Globe, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api-client";
import { useLanguage, type Language } from "../lib/LanguageContext";
import { useToast } from "../contexts/ToastContext";

interface TopbarProps {
  onMenuClick: () => void;
}

const ROLE_LABELS_ID: Record<string, string> = {
  super_admin: "Super Admin",
  ahli_pertama: "Pranata Ahli Pertama",
  AHLI_PERTAMA: "Pranata Ahli Pertama",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
  petugas: "Petugas Lapangan",
};

const ROLE_LABELS_EN: Record<string, string> = {
  super_admin: "Super Admin",
  ahli_pertama: "First Expert Officer",
  AHLI_PERTAMA: "First Expert Officer",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
  petugas: "Field Officer",
};

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowActivity(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["topbar-notifications"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/system/notifications");
        return res.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ["topbar-activities"],
    queryFn: async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>("/activities");
        return res.data || [];
      } catch {
        return [];
      }
    },
    enabled: showActivity && notifications.length === 0,
  });

  const unreadCount = notifications.filter((n: any) => !n.readAt).length;

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
      <div className="relative" ref={notifRef}>
        <button type="button" onClick={() => { setShowActivity((v) => !v); setShowProfile(false); }} className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label={t("notifications")}>
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          {(unreadCount > 0 || recentActivities.length > 0) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#161b22]" />
          )}
        </button>

        {showActivity && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1c2128] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.8} />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {language === "en" ? "Notifications & Activity" : "Notifikasi & Aktivitas"}
                </h4>
              </div>
              <button 
                type="button" 
                onClick={async () => {
                  await apiFetch("/system/notifications/read-all", { method: "PATCH" });
                  refetchNotifs();
                }}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                {language === "en" ? "Mark as read" : "Tandai dibaca"}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
              {notifications.length > 0 ? (
                notifications.slice(0, 8).map((n: any) => (
                  <div 
                    key={n.id} 
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer ${!n.readAt ? "bg-blue-50/40 dark:bg-blue-950/20" : ""}`}
                    onClick={() => {
                      if (n.type === "ASSIGNMENT") navigate("/penugasan");
                      else navigate("/kegiatan");
                      setShowActivity(false);
                    }}
                  >
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{n.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              ) : recentActivities.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  {language === "en" ? "No new notifications or activity." : "Belum ada notifikasi atau aktivitas baru."}
                </div>
              ) : (
                recentActivities.slice(0, 6).map((item: any) => (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer" onClick={() => { navigate("/kegiatan"); setShowActivity(false); }}>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.opdPenyelenggara || (language === "en" ? "Batu City Gov" : "Pemkot Batu")} • {item.deadline || (language === "en" ? "Available" : "Tersedia")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User profile dropdown trigger & menu */}
      <div className="relative ml-1" ref={profileRef}>
        <button
          type="button"
          onClick={() => {
            setShowProfile((v) => !v);
            setShowActivity(false);
          }}
          aria-expanded={showProfile}
          className="flex items-center gap-2 rounded-xl pl-3 pr-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1f5c]"
        >
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0f1f5c] dark:group-hover:text-sky-400 transition-colors">
              {user?.name ?? roleLabel}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {language === "en" ? "Batu City Government Diskominfo" : "Diskominfo Pemerintah Kota Batu"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform overflow-hidden ring-2 ring-transparent group-hover:ring-[#0f1f5c]/20">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name ?? "Avatar"} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1c2128] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Profil dalam Dropdown: Klik langsung ke Profil */}
            <div
              onClick={() => {
                setShowProfile(false);
                navigate(isPetugas ? "/petugas/profil" : "/profil");
              }}
              className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/80 hover:bg-gray-50/80 dark:hover:bg-gray-800/60 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs overflow-hidden shadow-xs flex-shrink-0">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name ?? "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#0f1f5c] dark:group-hover:text-sky-400 transition-colors">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.username?.includes("@") ? user.username : user?.username ? `@${user.username}` : (language === "en" ? "Diskominfo Batu City" : "Diskominfo Kota Batu")}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items: Profil & Pengaturan */}
            <div className="py-1.5 border-b border-gray-100 dark:border-gray-700/80">
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate(isPetugas ? "/petugas/profil" : "/profil");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 hover:text-[#0f1f5c] dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                <span>{t("profile")}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  navigate(isPetugas ? "/petugas/pengaturan" : "/pengaturan");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 hover:text-[#0f1f5c] dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                <span>{t("settings")}</span>
              </button>
            </div>

            {/* Logout button */}
            <div className="pt-1.5 pb-0.5">
              <button
                type="button"
                onClick={async () => {
                  setShowProfile(false);
                  await logout();
                  navigate("/login", { replace: true, state: {} });
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" strokeWidth={2} />
                <span>{t("logout")}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
