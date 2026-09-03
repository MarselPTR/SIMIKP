import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { LoadingSpinner } from "../components/shared/StateComponents";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner size="lg" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
};

export default ProtectedRoute;
