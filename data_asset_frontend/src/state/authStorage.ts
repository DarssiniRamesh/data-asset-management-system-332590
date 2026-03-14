const STORAGE_KEY = "assetConfig.jwt";

// PUBLIC_INTERFACE
export function getStoredToken(): string {
  /** Contract: returns token or empty string; never throws. */
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

// PUBLIC_INTERFACE
export function setStoredToken(token: string): void {
  /** Contract: stores token; accepts empty string to clear. */
  try {
    if (!token) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Best-effort in environments where storage is disabled.
  }
}

// PUBLIC_INTERFACE
export function getStorageKey(): string {
  /** Exposed for debug UI and docs. */
  return STORAGE_KEY;
}
