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

// PUBLIC_INTERFACE
export function AuthProvider({ children }: { children: React.ReactNode }) {
  /** Contract:
   * State:
   *  - token: JWT string (stored in localStorage)
   *  - user: derived from login response inputs (dev auth), not decoded
   * Errors:
   *  - login throws ApiError or network Error
   */
  const [token, setToken] = useState<string>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);

  const doLogin = useCallback(async (username: string, role: Role) => {
    logger.info("AuthFlow:login:start", { username, role });
    const resp = await apiLogin({ username, role });
    setStoredToken(resp.accessToken);
    setToken(resp.accessToken);
    setUser({ username: resp.username as string, role: role });
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
