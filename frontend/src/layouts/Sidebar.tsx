import { NavLink } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Users,
  Video,
  CheckSquare,
  Megaphone,
  FolderOpen,
  BarChart3,
  Settings,
} from "lucide-react";
import logoKotaBatu from "../assets/Logo_Kota_Batu.png";

interface MenuItem {
  path: string;
  label: string;
  icon: typeof Home;
}

export const menuItems: MenuItem[] = [
  { path: "/dashboard", label: "Beranda", icon: Home },
  { path: "/kegiatan", label: "Manajemen Kegiatan", icon: CalendarDays },
  { path: "/penugasan", label: "Penugasan Tim", icon: Users },
  { path: "/produksi", label: "Produksi Konten", icon: Video },
  { path: "/review", label: "Review & Persetujuan", icon: CheckSquare },
  { path: "/publikasi", label: "Publikasi Media", icon: Megaphone },
  { path: "/bank-konten", label: "Bank Konten", icon: FolderOpen },
  { path: "/laporan", label: "Laporan & Statistik", icon: BarChart3 },
];

const NAVY = "#0f1f5c";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  return (
    <aside className="h-full w-64 flex flex-col border-r border-gray-200 bg-white shadow-2xl lg:shadow-none">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logoKotaBatu} alt="Logo Kota Batu" className="w-10 h-10 object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-bold" style={{ color: NAVY }}>
              SIMIKP
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Tutup Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "font-semibold text-white bg-[#0f1f5c] shadow-xs"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Pengaturan */}
      <div className="px-3 pb-4 pt-1 border-t border-gray-100">
        <button
          type="button"
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
          <span>Pengaturan</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
