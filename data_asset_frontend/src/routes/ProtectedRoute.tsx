import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export function ProtectedRoute() {
  /** Contract:
   * - If not authenticated, redirects to / (landing) and preserves from= location state
   * - Landing page contains embedded sign-in
   */
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
