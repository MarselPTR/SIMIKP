import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

const NAVY = "#0f1f5c";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  reviewer: "Reviewer",
  petugas: "Petugas Lapangan",
};

const BIDANG_LABELS: Record<string, string> = {
  PRAHUM: "Pranata Humas (PRAHUM)",
  FOTO_VIDEO: "Foto & Video",
  DESAINER_EDITOR: "Desainer & Editor",
};

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AU";

  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : "-";
  const bidangLabel = user?.staffType ? BIDANG_LABELS[user.staffType] ?? user.staffType : null;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
        Kembali
      </button>

      <h1 className="text-2xl font-bold mb-1 dark:text-gray-100" style={{ color: NAVY }}>Profil Pengguna</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Informasi akun dan identitas pengguna SIMIKP Kota Batu</p>

      {/* Avatar card */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: NAVY }}>
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.name ?? "-"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user?.username ?? "-"}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: NAVY + "20", color: NAVY }}>{roleLabel}</span>
              {bidangLabel && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{bidangLabel}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
        <div className="px-6 py-4">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-3">Informasi Akun</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Nama Lengkap</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Username / Email</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.username ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Peran (Role)</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: NAVY + "20", color: NAVY }}>{roleLabel}</span>
            </div>
            {bidangLabel && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Bidang Kerja</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{bidangLabel}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">ID Pengguna</span>
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{user?.id ?? "-"}</span>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-3">Instansi</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Dinas</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Diskominfo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Kota</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Kota Batu</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sistem</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">SIMIKP</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">Untuk memperbarui data profil, hubungi administrator sistem.</p>
    </div>
  );
}
