export type LogLevel = "debug" | "info" | "warn" | "error";

export type AppConfig = {
  apiBaseUrl: string;
  healthPath: string;
  logLevel: LogLevel;
};

function normalizeBaseUrl(input: string): string {
  return input.replace(/\/$/, "");
}

// PUBLIC_INTERFACE
export function getAppConfig(): AppConfig {
  /** Contract:
   * Inputs:
   *  - process.env.REACT_APP_API_BASE (preferred) OR REACT_APP_BACKEND_URL (fallback)
   * Outputs:
   *  - Normalized base URL (no trailing slash)
   * Errors:
   *  - none (falls back to http://localhost:3001)
   */
  const apiBase =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:3001";

  const healthPath = process.env.REACT_APP_HEALTHCHECK_PATH || "/healthz";
  const logLevel = (process.env.REACT_APP_LOG_LEVEL as LogLevel) || "info";

  return {
    apiBaseUrl: normalizeBaseUrl(apiBase),
    healthPath,
    logLevel,
  };
}
