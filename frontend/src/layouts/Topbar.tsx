import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Bell, ChevronDown, MoreHorizontal } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { mockUsers, Role } from "../lib/mock-data";

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
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();

  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : "Admin/Manager";

  const handleSwitchAccount = (mockUser: (typeof mockUsers)[0]) => {
    switchUser(mockUser);
    setShowProfile(false);
    if (mockUser.role === Role.PETUGAS) {
      navigate("/petugas/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

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
            <p className="text-sm font-bold text-gray-900">{user?.name ?? roleLabel}</p>
            <p className="text-xs text-gray-400">
              {user?.staffType ? `Petugas · ${user.staffType}` : "Diskominfo Pemerintah Kota Batu"}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "AU"}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2} />
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#0f1f5c] text-white flex items-center justify-center font-bold text-sm">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "AU"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.username ?? ""}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-1.5">
                <span
                  className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${NAVY}15`, color: NAVY }}
                >
                  {user?.role ?? "staff"}
                </span>
                {user?.staffType && (
                  <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {user.staffType}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Switcher Section */}
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase px-2 mb-1.5">
                Ganti Akun Demo
              </p>
              <div className="space-y-1">
                {mockUsers
                  .filter((u) => u.role === Role.ADMIN || u.role === Role.PETUGAS)
                  .map((u) => {
                    const isCurrent = user?.name === u.name || user?.username === u.email;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSwitchAccount(u)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? "bg-blue-50 text-blue-900 font-bold"
                            : "text-gray-700 hover:bg-gray-50 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-bold">
                            {u.avatar}
                          </div>
                          <span>{u.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {u.bidang ?? (u.role === Role.ADMIN ? "Admin" : u.role)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setShowProfile(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
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
