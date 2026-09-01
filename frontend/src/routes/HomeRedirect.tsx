import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const HomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user?.role?.toLowerCase() === "petugas" ? "/petugas/dashboard" : "/dashboard"} replace />;
};

export default HomeRedirect;
