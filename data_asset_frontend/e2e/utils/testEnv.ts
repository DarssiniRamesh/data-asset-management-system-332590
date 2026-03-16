import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";

export type TestEnv = {
  frontendBaseUrl: string;
  backendBaseUrl: string;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[e2e env] Missing required environment variable ${name}. ` +
        `Playwright E2E tests must be run with environment-provided URLs (no localhost defaults).`,
    );
  }
  return value;
}

function resolveFrontendBaseUrl(): string {
  // Prefer the explicitly provided frontend URL.
  const raw =
    process.env.REACT_APP_FRONTEND_URL ||
    // Fallback for some CI setups.
    process.env.PLAYWRIGHT_BASE_URL;

  return normalizeBaseUrl(requiredEnv("REACT_APP_FRONTEND_URL", raw));
}

function resolveBackendBaseUrl(): string {
  // Preferred env var for backend base (as defined for this container).
  const raw =
    process.env.REACT_APP_BACKEND_URL ||
    // Back-compat (older code used API_BASE).
    process.env.REACT_APP_API_BASE;

  // If the API base is set to something like https://host/api, we still want the origin for /api/* routes.
  // Keep it simple: just normalize trailing slash; tests append /api/... themselves.
  return normalizeBaseUrl(requiredEnv("REACT_APP_BACKEND_URL", raw));
}

// PUBLIC_INTERFACE
export function getTestEnv(): TestEnv {
  /** Resolve base URLs from environment variables; never default to localhost. */
  const frontendBaseUrl = resolveFrontendBaseUrl();
  const backendBaseUrl = resolveBackendBaseUrl();
  return { frontendBaseUrl, backendBaseUrl };
}

async function safeReadBody(res: APIResponse): Promise<string> {
  try {
    // Prefer text() to handle non-JSON ProblemDetails etc.
    return await res.text();
  } catch {
    return "<unable to read response body>";
  }
}

function buildApiFailureMessage(opts: {
  method: string;
  url: string;
  status: number;
  statusText: string;
  requestData?: unknown;
  responseBody?: string;
}): string {
  const parts: string[] = [];
  parts.push(`[e2e api] ${opts.method} ${opts.url} failed`);
  parts.push(`status: ${opts.status} ${opts.statusText}`);
  if (opts.requestData !== undefined) parts.push(`request data: ${JSON.stringify(opts.requestData, null, 2)}`);
  if (opts.responseBody !== undefined) parts.push(`response body: ${opts.responseBody}`);
  return parts.join("\n");
}

/**
 * API helpers
 *
 * Contract:
 * - Input: relative path under backend base URL (e.g. "/api/assets")
 * - Output: APIResponse when status is OK (or within okStatuses where specified)
 * - Errors: throws with rich context (method/url/status/body) on failure
 */

// PUBLIC_INTERFACE
export async function apiGet(
  request: APIRequestContext,
  path: string,
  opts: { token?: string; okStatuses?: number[] } = {},
): Promise<APIResponse> {
  /** GET helper that logs useful details on failure. */
  const { backendBaseUrl } = getTestEnv();
  const url = `${backendBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await request.get(url, {
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
  });

  const okStatuses = opts.okStatuses ?? [200];
  if (!okStatuses.includes(res.status())) {
    const responseBody = await safeReadBody(res);
    throw new Error(
      buildApiFailureMessage({
        method: "GET",
        url,
        status: res.status(),
        statusText: res.statusText(),
        responseBody,
      }),
    );
  }

  return res;
}

// PUBLIC_INTERFACE
export async function apiPost(
  request: APIRequestContext,
  path: string,
  opts: { token?: string; data?: unknown } = {},
): Promise<APIResponse> {
  /** POST helper that logs useful details on failure. */
  const { backendBaseUrl } = getTestEnv();
  const url = `${backendBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await request.post(url, {
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    data: opts.data,
  });

  if (!res.ok()) {
    const responseBody = await safeReadBody(res);
    throw new Error(
      buildApiFailureMessage({
        method: "POST",
        url,
        status: res.status(),
        statusText: res.statusText(),
        requestData: opts.data,
        responseBody,
      }),
    );
  }

  return res;
}

// PUBLIC_INTERFACE
export async function apiPut(
  request: APIRequestContext,
  path: string,
  opts: { token?: string; data?: unknown } = {},
): Promise<APIResponse> {
  /** PUT helper that logs useful details on failure. */
  const { backendBaseUrl } = getTestEnv();
  const url = `${backendBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await request.put(url, {
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    data: opts.data,
  });

  if (!res.ok()) {
    const responseBody = await safeReadBody(res);
    throw new Error(
      buildApiFailureMessage({
        method: "PUT",
        url,
        status: res.status(),
        statusText: res.statusText(),
        requestData: opts.data,
        responseBody,
      }),
    );
  }

  return res;
}

// PUBLIC_INTERFACE
export async function apiDelete(
  request: APIRequestContext,
  path: string,
  opts: { token?: string; data?: unknown; okStatuses?: number[] } = {},
): Promise<APIResponse> {
  /** DELETE helper that logs useful details on failure. */
  const { backendBaseUrl } = getTestEnv();
  const url = `${backendBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await request.delete(url, {
    headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    data: opts.data,
  });

  const okStatuses = opts.okStatuses ?? [200, 202, 204];
  if (!okStatuses.includes(res.status())) {
    const responseBody = await safeReadBody(res);
    throw new Error(
      buildApiFailureMessage({
        method: "DELETE",
        url,
        status: res.status(),
        statusText: res.statusText(),
        requestData: opts.data,
        responseBody,
      }),
    );
  }

  return res;
}

// PUBLIC_INTERFACE
export async function uiLogin(page: Page, opts: { username?: string; role: "Viewer" | "Editor" | "Admin" }): Promise<void> {
  /**
   * UI-login through the landing page (/) where the sign-in form is embedded.
   * This exercises the backend /api/auth/login via the UI, ensuring end-to-end auth wiring works.
   */
  const username = opts.username || "demo";

  // New login UX: embedded form on landing page; /login is no longer a routed page.
  await page.goto("/");

  // Assert the embedded sign-in form is present using stable, accessible selectors.
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Role")).toBeVisible();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Role").selectOption(opts.role);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Successful login navigates to /app (DashboardLayout).
  await expect(page).toHaveURL(/\/app(\/|$)/);
}

// PUBLIC_INTERFACE
export async function apiLoginToken(
  request: APIRequestContext,
  opts: { username?: string; role: "Viewer" | "Editor" | "Admin" },
): Promise<string> {
  /** Get JWT via backend dev login endpoint. */
  const res = await apiPost(request, "/api/auth/login", {
    data: {
      username: opts.username || "demo",
      role: opts.role,
    },
  });

  const body = (await res.json()) as { accessToken: string };
  expect(body.accessToken).toBeTruthy();
  return body.accessToken;
}

export type CreatedAsset = {
  assetId: string;
  assetName: string;
  permitEuId: string;
  globalUniqueAssetId: string;
};

// PUBLIC_INTERFACE
export async function apiCreateAsset(
  request: APIRequestContext,
  token: string,
  opts: {
    siteId?: string;
    assetGroup?: string;
    processGroup?: string;
    assetNamePrefix?: string;
    createdBy?: string;
  } = {},
): Promise<CreatedAsset> {
  /**
   * Create an asset using POST /api/assets with unique IDs to avoid 409 conflicts.
   * This is used to set up data for copy/edit/delete tests.
   */
  const ts = Date.now();
  const assetName = `${opts.assetNamePrefix || "PW-ASSET"}-${ts}`;
  const permitEuId = `PW-PERMIT-${ts}`;
  const globalUniqueAssetId = `PW-GUA-${ts}`;

  const res = await apiPost(request, "/api/assets", {
    token,
    data: {
      siteId: opts.siteId || "SITE-001",
      assetGroup: opts.assetGroup || "AG",
      processGroup: opts.processGroup || "PG",
      assetName,
      permitEuId,
      globalUniqueAssetId,
      requiresParentPseudo: false,
      parentPseudoAssetId: null,
      createdBy: opts.createdBy || "pw",
      correlationId: `pw-corr-${ts}`,
    },
  });

  const body = (await res.json()) as { assetId: number | string; assetName: string; permitEuId: string; globalUniqueAssetId: string };
  return {
    assetId: String(body.assetId),
    assetName: body.assetName,
    permitEuId: body.permitEuId,
    globalUniqueAssetId: body.globalUniqueAssetId,
  };
}

// PUBLIC_INTERFACE
export async function apiDeleteAsset(request: APIRequestContext, token: string, assetId: string): Promise<void> {
  /** Delete an asset (Admin role required) */
  await apiDelete(request, `/api/assets/${encodeURIComponent(assetId)}`, {
    token,
    data: { modifiedBy: "pw", correlationId: `pw-del-${Date.now()}` },
    // Most environments: 204. If asset already deleted in a prior run, allow 404.
    okStatuses: [204, 404],
  });
}

// PUBLIC_INTERFACE
export async function apiCopyAsset(
  request: APIRequestContext,
  token: string,
  assetId: string,
  newAssetName: string,
): Promise<{ targetAssetId?: string; copyOperationId?: string; replicationResultStatus?: string }> {
  /**
   * Copy an asset and return best-effort metadata from backend response.
   * BRD focus: create-semantics + lineage visibility.
   */
  const res = await apiPost(request, `/api/assets/${encodeURIComponent(assetId)}/copy`, {
    token,
    data: { newAssetName },
  });

  const body = (await res.json()) as any;

  // Backend payload variants supported by UI code: best-effort extract.
  const targetId =
    body?.targetAssetId ??
    body?.TargetAssetId ??
    body?.newAssetId ??
    body?.NewAssetId ??
    body?.targetAsset?.assetId ??
    body?.targetAsset?.AssetId ??
    body?.TargetAsset?.AssetId;

  const copyOperationId =
    body?.copyOperationId ??
    body?.CopyOperationId ??
    body?.lineage?.copyOperationId ??
    body?.lineage?.CopyOperationId ??
    body?.lineage?.copyOperationID;

  const replicationResultStatus = body?.replicationResultStatus ?? body?.ReplicationResultStatus ?? body?.lineage?.replicationResultStatus;

  return {
    targetAssetId: targetId !== undefined && targetId !== null ? String(targetId) : undefined,
    copyOperationId: typeof copyOperationId === "string" && copyOperationId ? copyOperationId : undefined,
    replicationResultStatus: typeof replicationResultStatus === "string" ? replicationResultStatus : undefined,
  };
}
