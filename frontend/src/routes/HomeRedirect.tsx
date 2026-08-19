import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Role } from "../lib/mock-data";

const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user?.role === Role.PETUGAS ? "/petugas/dashboard" : "/dashboard"} replace />;
};

export default HomeRedirect;
