import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Role } from "../api/types";
import { login as apiLogin } from "../api/endpoints";
import { logger } from "../lib/logger";
import { getStoredToken, setStoredToken } from "./authStorage";

export type AuthUser = {
  username: string;
  role: Role;
};

export type AuthState = {
  token: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  // PUBLIC_INTERFACE
  login: (username: string, role: Role) => Promise<void>;
  // PUBLIC_INTERFACE
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];

    // base64url -> base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");

    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function roleFromToken(token: string): Role | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  // ASP.NET ClaimTypes.Role typically becomes this URI claim in JWT
  const roleClaim =
    (payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as string | undefined) ??
    (payload["role"] as string | undefined);

  if (roleClaim === "Admin" || roleClaim === "Editor" || roleClaim === "Viewer") return roleClaim;
  return null;
}

function usernameFromToken(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;
  const name =
    (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] as string | undefined) ??
    (payload["unique_name"] as string | undefined) ??
    (payload["sub"] as string | undefined);
  return name ?? null;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }: { children: React.ReactNode }) {
  /** Contract:
   * State:
   *  - token: JWT string (stored in localStorage)
   *  - user: derived from JWT payload (role + username) when possible
   * Errors:
   *  - login throws ApiError or network Error
   */
  const [token, setToken] = useState<string>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken();
    if (!t) return null;
    const role = roleFromToken(t);
    const username = usernameFromToken(t);
    if (!role || !username) return null;
    return { role, username };
  });

  const doLogin = useCallback(async (username: string, role: Role) => {
    logger.info("AuthFlow:login:start", { username, role });
    const resp = await apiLogin({ username, role });

    setStoredToken(resp.accessToken);
    setToken(resp.accessToken);

    // Prefer backend response role, fallback to token parsing, finally fallback to selected role.
    const parsedRole = roleFromToken(resp.accessToken);
    const normalizedRole =
      resp.role === "Admin" || resp.role === "Editor" || resp.role === "Viewer"
        ? (resp.role as Role)
        : parsedRole ?? role;

    setUser({ username: resp.username as string, role: normalizedRole });

    logger.info("AuthFlow:login:success", { username: resp.username, role: resp.role });
  }, []);

  const doLogout = useCallback(() => {
    logger.info("AuthFlow:logout");
    setStoredToken("");
    setToken("");
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      login: doLogin,
      logout: doLogout,
    };
  }, [doLogin, doLogout, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth(): AuthContextValue {
  /** Contract: must be used within AuthProvider. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
