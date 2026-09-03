import { NavLink, useNavigate } from "react-router-dom";
import {
  Home, CalendarDays, Users, Video, CheckSquare,
  Megaphone, FolderOpen, BarChart3, Settings, UserPlus, Contact
} from "lucide-react";
import logoKotaBatu from "../assets/Logo_Kota_Batu.png";
import { useLanguage, type TranslationKey } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";

interface NavItemConfig {
  path: string;
  key: TranslationKey;
  icon: typeof Home;
}

// Navigasi untuk Admin / Manajemen (Review & Persetujuan telah dipindahkan ke Ahli Pertama)
export const adminNavConfig: NavItemConfig[] = [
  { path: "/dashboard", key: "dashboard", icon: Home },
  { path: "/kegiatan", key: "activities", icon: CalendarDays },
  { path: "/penugasan", key: "assignments", icon: Users },
  { path: "/produksi", key: "production", icon: Video },
  { path: "/publikasi", key: "media_pub", icon: Megaphone },
  { path: "/bank-konten", key: "content_bank", icon: FolderOpen },
  { path: "/laporan", key: "reports_stats", icon: BarChart3 },
  { path: "/daftar-anggota", key: "member_list", icon: Contact },
  { path: "/tambah-petugas", key: "add_officer", icon: UserPlus },
];

// Navigasi khusus Ahli Pertama (Fokus Pengawasan: Dashboard & Review/Persetujuan)
export const ahliPertamaNavConfig: NavItemConfig[] = [
  { path: "/dashboard", key: "dashboard", icon: Home },
  { path: "/review", key: "review_approval", icon: CheckSquare },
];

export const navConfig = adminNavConfig;

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAhliPertama = user?.role?.toLowerCase() === "ahli_pertama" || user?.staffType === "AHLI_PERTAMA";
  const activeNavItems = isAhliPertama ? ahliPertamaNavConfig : adminNavConfig;

  return (
    <aside className="h-full w-64 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] shadow-2xl lg:shadow-none transition-colors">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-10 h-10 object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#0f1f5c] dark:text-sky-400">SIMIKP</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Diskominfo Kota Batu</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden" aria-label={t("close")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {activeNavItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.key);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "font-semibold text-white bg-[#0f1f5c] shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Pengaturan di bawah */}
      <div className="px-3 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate("/pengaturan")}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 transition-all cursor-pointer"
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
          <span>{t("settings")}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
