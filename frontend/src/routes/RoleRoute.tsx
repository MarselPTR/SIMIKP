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
      // Akun manajemen (Ahli Pertama, Admin, dsb) yang mendarat di /petugas/* otomatis dialihkan
      const destination = userRoleLower === Role.AHLI_PERTAMA.toLowerCase() ? "/review" : "/dashboard";
      return <Navigate to={destination} replace />;
    }
  }

  return <Outlet />;
};

export default RoleRoute;
