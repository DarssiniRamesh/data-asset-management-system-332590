import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export function ProtectedRoute() {
  /** Contract:
   * - If not authenticated, redirects to /login and preserves from= location state
   */
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
