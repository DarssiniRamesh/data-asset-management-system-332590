import { Navigate } from "react-router-dom";

/**
 * Compatibility note:
 * The standalone login page was removed in favor of embedded login on the LandingPage.
 * This file remains as a lightweight shim so any legacy imports/tests don't fail.
 */

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Contract: Redirect to landing page (embedded sign-in). */
  return <Navigate to="/" replace />;
}
