import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../lib/ThemeContext";

const NAVY = "#0f1f5c";

const sections = [
  { id: "akun", label: "Akun & Keamanan" },
  { id: "notifikasi", label: "Notifikasi" },
  { id: "tampilan", label: "Tampilan" },
];

export default function PengaturanPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState("akun");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(false);
  const [bahasa, setBahasa] = useState("id");

  return (
    <div className="max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
        Kembali
      </button>

      <h1 className="text-2xl font-bold mb-1 dark:text-gray-100" style={{ color: isDark ? undefined : NAVY }}>Pengaturan</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Kelola preferensi dan konfigurasi akun SIMIKP Anda</p>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={"w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 " + (activeSection === s.id ? "text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}
                style={activeSection === s.id ? { backgroundColor: NAVY } : {}}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {activeSection === "akun" && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <div className="px-6 py-4">
                <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-4">Keamanan</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Saat Ini</label>
                    <input type="password" disabled placeholder="••••••••" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
                    <input type="password" disabled placeholder="Hubungi admin untuk mengubah password" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">Perubahan password hanya dapat dilakukan oleh administrator sistem.</p>
              </div>
            </div>
          )}

          {activeSection === "notifikasi" && (
            <div className="px-6 py-5">
              <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-4">Preferensi Notifikasi</p>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Notifikasi Email</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Terima ringkasan kegiatan dan penugasan via email</p>
                  </div>
                  <button type="button" onClick={() => setNotifEmail((v) => !v)} className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors " + (notifEmail ? "bg-[#0f1f5c]" : "bg-gray-200 dark:bg-gray-700")}>
                    <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform " + (notifEmail ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Notifikasi Browser</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tampilkan notifikasi push di browser</p>
                  </div>
                  <button type="button" onClick={() => setNotifBrowser((v) => !v)} className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors " + (notifBrowser ? "bg-[#0f1f5c]" : "bg-gray-200 dark:bg-gray-700")}>
                    <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform " + (notifBrowser ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "tampilan" && (
            <div className="px-6 py-5">
              <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-4">Preferensi Tampilan</p>
              <div className="space-y-5">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Bahasa Antarmuka</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Pilih bahasa tampilan sistem</p>
                  </div>
                  <select
                    value={bahasa}
                    onChange={(e) => setBahasa(e.target.value)}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
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
