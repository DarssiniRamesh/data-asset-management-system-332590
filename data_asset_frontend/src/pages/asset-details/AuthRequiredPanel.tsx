import React from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/client";

type Props = {
  title: string;
  message?: string;
};

/** Detect whether an error is an authentication/authorization failure. */
function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && err.details.status === 401;
}

// PUBLIC_INTERFACE
export function AuthRequiredPanel({ title, message }: Props) {
  /** AssetDetailsAuthGuardFlow
   * Contract:
   * - Inputs:
   *    - title: string (short label for the panel)
   *    - message?: string (optional longer explanation)
   * - Behavior:
   *    - Renders a consistent, actionable guidance panel when the user must re-authenticate.
   * - Side effects:
   *    - None (pure UI)
   */
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-soft dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm opacity-90">
        {message ||
          "Your session has expired or you are not authorized to load master data required for this tab. Please log in again, then retry."}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link className="btn-primary" to="/login">
          Log in again
        </Link>
        <div className="text-xs opacity-80">
          If you are already logged in, refresh the page after re-authenticating.
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function shouldShowAuthRequired(err: unknown): boolean {
  /** Contract:
   * - Inputs: unknown error (typically caught from apiRequest)
   * - Output: boolean
   * - Invariant: returns true iff error is an ApiError with HTTP 401
   */
  return isAuthError(err);
}
