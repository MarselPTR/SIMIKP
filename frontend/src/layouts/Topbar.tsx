import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, ChevronDown, MoreHorizontal } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const NAVY = "#0f1f5c";

interface TopbarProps {
  onMenuClick: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
  petugas: "Petugas Lapangan",
};

const activityFeed = [
  { id: "a1", text: "Budi Santoso menyetujui konten \"Artikel SEO\".", time: "5 menit lalu" },
  { id: "a2", text: "Kegiatan baru \"Sosialisasi Pajak\" telah dibuat.", time: "22 menit lalu" },
  { id: "a3", text: "Dewi Lestari meminta revisi \"Desain Landing Page\".", time: "1 jam lalu" },
  { id: "a4", text: "Publikasi \"Blog: Panduan React\" telah tayang.", time: "3 jam lalu" },
];

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : "Admin/Manager";
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "AU";

  return (
    <header className="h-16 bg-white dark:bg-[#161b22] border-b border-gray-100 dark:border-gray-800 flex items-center justify-end gap-1 px-6 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 mr-auto">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Help */}
      <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Bantuan">
        <HelpCircle className="w-5 h-5" strokeWidth={1.8} />
      </button>



      {/* Notification bell */}
      <div className="relative">
        <button type="button" onClick={() => { setShowActivity((v) => !v); setShowProfile(false); }} className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" aria-label="Notifikasi">
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#161b22]" />
        </button>

        {showActivity && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1c2128] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.8} />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity Feed</h4>
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
      <div className="relative ml-1">
        <button onClick={() => { setShowProfile((v) => !v); setShowActivity(false); }} className="flex items-center gap-2 rounded-lg pl-3 pr-1.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.name ?? roleLabel}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Diskominfo Pemerintah Kota Batu</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs">{initials}</div>
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1c2128] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs">{initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name ?? "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.username ?? ""}</p>
                </div>
              </div>
              <span className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${NAVY}20`, color: NAVY }}>
                {user?.role ?? "admin"}
              </span>
            </div>

            <div className="py-1 border-b border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => { setShowProfile(false); navigate("/profil"); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Profil
              </button>
              <button type="button" onClick={() => { setShowProfile(false); navigate("/pengaturan"); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Pengaturan
              </button>
            </div>

            <div className="py-1">
              <button type="button" onClick={() => { setShowProfile(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                Keluar
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
