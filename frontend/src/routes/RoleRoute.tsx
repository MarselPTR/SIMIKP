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

  if (user && !allow.includes(user.role)) {
    return <Navigate to={user.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
