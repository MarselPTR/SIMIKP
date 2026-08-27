import { useState } from "react";
import { HelpCircle, Bell, ChevronDown, MoreHorizontal } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const NAVY = "#0f1f5c";

interface TopbarProps {
  onMenuClick: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
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

  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : "Admin/Manager";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end gap-1 px-6 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 mr-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Help */}
      <button
        type="button"
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
        aria-label="Bantuan"
      >
        <HelpCircle className="w-5 h-5" strokeWidth={1.8} />
      </button>

      {/* Notification bell */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowActivity((v) => !v);
            setShowProfile(false);
          }}
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {showActivity && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
                <h4 className="text-sm font-semibold text-gray-900">Activity Feed</h4>
              </div>
              <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Opsi lainnya">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {activityFeed.map((item) => (
                <div key={item.id} className="px-4 py-3 hover:bg-gray-50 transition">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: user role + org */}
      <div className="relative ml-1">
        <button
          onClick={() => {
            setShowProfile((v) => !v);
            setShowActivity(false);
          }}
          className="flex items-center gap-2 rounded-lg pl-3 pr-1.5 py-1.5 hover:bg-gray-50 transition"
        >
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-bold text-gray-900">{roleLabel}</p>
            <p className="text-xs text-gray-400">Diskominfo Pemerintah Kota Batu</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2} />
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user?.name ?? "User"}</p>
              <p className="text-xs text-gray-500">{user?.username ?? ""}</p>
              <span
                className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${NAVY}15`, color: NAVY }}
              >
                {user?.role ?? "staff"}
              </span>
            </div>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              Profil
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              Pengaturan
            </button>
            <button
              onClick={() => {
                setShowProfile(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
