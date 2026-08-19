import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

const NAVY = "#0f1f5c";

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 mr-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right: user avatar + name */}
      <div className="relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
            style={{ backgroundColor: "#e8622a" }}
          >
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name ?? "Admin"}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showProfile && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{user?.name ?? "User"}</p>
              <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
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
