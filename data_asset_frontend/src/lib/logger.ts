import { getAppConfig, type LogLevel } from "../config";

type LogContext = Record<string, unknown>;

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel): boolean {
  const cfg = getAppConfig();
  return levelOrder[level] >= levelOrder[cfg.logLevel];
}

function fmt(ctx?: LogContext): string {
  if (!ctx) return "";
  try {
    return JSON.stringify(ctx);
  } catch {
    return String(ctx);
  }
}

// PUBLIC_INTERFACE
export const logger = {
  /** Contract:
   * Inputs:
   *  - message: human-readable message
   *  - context: structured fields for debugging (no secrets)
   * Side effects:
   *  - Writes to console (controlled by REACT_APP_LOG_LEVEL)
   */
  debug(message: string, context?: LogContext) {
    if (!shouldLog("debug")) return;
    // eslint-disable-next-line no-console
    console.debug(`[debug] ${message}`, fmt(context));
  },
  info(message: string, context?: LogContext) {
    if (!shouldLog("info")) return;
    // eslint-disable-next-line no-console
    console.info(`[info] ${message}`, fmt(context));
  },
  warn(message: string, context?: LogContext) {
    if (!shouldLog("warn")) return;
    // eslint-disable-next-line no-console
    console.warn(`[warn] ${message}`, fmt(context));
  },
  error(message: string, context?: LogContext) {
    if (!shouldLog("error")) return;
    // eslint-disable-next-line no-console
    console.error(`[error] ${message}`, fmt(context));
  },
};
