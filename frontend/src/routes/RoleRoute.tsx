import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Role } from "../lib/mock-data";

interface RoleRouteProps {
  allow: string[];
}

// Menjaga agar akun petugas hanya melihat area /petugas/*, dan akun manajemen
// (admin/manager/staff/reviewer) hanya melihat area dashboard yang sudah ada —
// tanpa ini, user tetap bisa loncat area lewat URL langsung.
const RoleRoute = ({ allow }: RoleRouteProps) => {
  const { user } = useAuth();

  if (user) {
    const userRoleLower = user.role.toLowerCase();
    const isAllowed = allow.some((r) => r.toLowerCase() === userRoleLower);
    
    if (!isAllowed) {
      if (userRoleLower === Role.PETUGAS.toLowerCase()) {
        return <Navigate to="/petugas/dashboard" replace />;
      }
      // Jangan redirect ke /login karena menyebabkan infinite loop dengan LoginPage!
      // Tampilkan pesan error 403 Forbidden agar kita tahu role apa yang bermasalah.
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0d1117]">
          <div className="text-center p-8 bg-white dark:bg-[#161b22] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Akun Anda dengan peran <span className="font-bold text-gray-900 dark:text-gray-100">"{user.role}"</span> tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <p className="text-sm text-gray-400 mt-4">Silakan hubungi administrator.</p>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
};

export default RoleRoute;
