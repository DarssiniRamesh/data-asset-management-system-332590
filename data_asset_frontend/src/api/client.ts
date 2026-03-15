import { getAppConfig } from "../config";
import { logger } from "../lib/logger";
import { getStoredToken } from "../state/authStorage";

export type ApiErrorShape = {
  status: number;
  statusText: string;
  url: string;
  bodyText?: string;
};

export class ApiError extends Error {
  public readonly details: ApiErrorShape;

  constructor(message: string, details: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  /**
   * When true (default), include Authorization header if a token exists.
   * Some deployments/proxies have incomplete CORS allowlists for Authorization,
   * which can cause the browser to perform a preflight and then block the actual request.
   */
  auth?: boolean;
};

async function readTextSafe(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// PUBLIC_INTERFACE
export async function apiRequest<T>(opts: RequestOptions): Promise<T> {
  /** API Request Flow (single canonical code path)
   * Inputs:
   *  - method/path/body/headers
   * Outputs:
   *  - parsed JSON (if response has JSON) or throws ApiError
   * Errors:
   *  - ApiError for non-2xx
   *  - Error for network/parse failures (with context logged)
   * Side effects:
   *  - network call
   * Observability:
   *  - logs start/end/failure with url + status
   */
  const cfg = getAppConfig();
  const url = `${cfg.apiBaseUrl}${opts.path}`;

  const token = getStoredToken();
  const headers = new Headers();

  // Only set Content-Type when we actually send a JSON body.
  // Setting it on GET triggers a CORS preflight on cross-origin calls, and some
  // environments only partially support the required Access-Control-Allow-Headers.
  const hasBody = opts.body !== undefined;
  if (hasBody) headers.set("Content-Type", "application/json");

  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) headers.set(k, v);
  }

  // Default to including auth, but allow opt-out for endpoints that are public
  // or where CORS preflight blocks reads in certain environments.
  const useAuth = opts.auth !== false;
  if (useAuth && token) headers.set("Authorization", `Bearer ${token}`);

  logger.debug("apiRequest:start", { method: opts.method, url });

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (e) {
    logger.error("apiRequest:network_error", {
      method: opts.method,
      url,
      message: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }

  const bodyText = await readTextSafe(res);
  if (!res.ok) {
    logger.warn("apiRequest:http_error", {
      method: opts.method,
      url,
      status: res.status,
      statusText: res.statusText,
      bodyText,
    });
    throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, {
      status: res.status,
      statusText: res.statusText,
      url,
      bodyText,
    });
  }

  // Handle empty response bodies.
  if (!bodyText) {
    logger.debug("apiRequest:ok_empty", { method: opts.method, url, status: res.status });
    return undefined as T;
  }

  // Attempt JSON parse, but keep error context.
  try {
    const data = JSON.parse(bodyText) as T;
    logger.debug("apiRequest:ok", { method: opts.method, url, status: res.status });
    return data;
  } catch (e) {
    logger.error("apiRequest:parse_error", {
      method: opts.method,
      url,
      status: res.status,
      bodyText: bodyText.slice(0, 5000),
    });
    throw e;
  }
}
