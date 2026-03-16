import { expect, type APIRequestContext, type Page } from "@playwright/test";

export type TestEnv = {
  frontendBaseUrl: string;
  backendBaseUrl: string;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

// PUBLIC_INTERFACE
export function getTestEnv(): TestEnv {
  /** Resolve base URLs from the same env vars used by the CRA app. */
  const frontendBaseUrl = normalizeBaseUrl(process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000");
  const backendBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "http://localhost:3001");
  return { frontendBaseUrl, backendBaseUrl };
}

// PUBLIC_INTERFACE
export async function uiLogin(page: Page, opts: { username?: string; role: "Viewer" | "Editor" | "Admin" }): Promise<void> {
  /**
   * UI-login through /login and the Sign in button.
   * This exercises the backend /api/auth/login via the UI, ensuring end-to-end auth wiring works.
   */
  const username = opts.username || "demo";

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Role").selectOption(opts.role);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Successful login navigates to /app (DashboardLayout)
  await expect(page).toHaveURL(/\/app/);
}

// PUBLIC_INTERFACE
export async function apiLoginToken(request: APIRequestContext, opts: { username?: string; role: "Viewer" | "Editor" | "Admin" }): Promise<string> {
  /** Get JWT via backend dev login endpoint. */
  const { backendBaseUrl } = getTestEnv();
  const res = await request.post(`${backendBaseUrl}/api/auth/login`, {
    data: {
      username: opts.username || "demo",
      role: opts.role,
    },
  });
  expect(res.ok()).toBeTruthy();
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
  const { backendBaseUrl } = getTestEnv();
  const ts = Date.now();
  const assetName = `${opts.assetNamePrefix || "PW-ASSET"}-${ts}`;
  const permitEuId = `PW-PERMIT-${ts}`;
  const globalUniqueAssetId = `PW-GUA-${ts}`;

  const res = await request.post(`${backendBaseUrl}/api/assets`, {
    headers: { Authorization: `Bearer ${token}` },
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

  expect(res.ok()).toBeTruthy();
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
  const { backendBaseUrl } = getTestEnv();
  const res = await request.delete(`${backendBaseUrl}/api/assets/${encodeURIComponent(assetId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { modifiedBy: "pw", correlationId: `pw-del-${Date.now()}` },
  });

  // Most environments: 204. If asset already deleted in a prior run, allow 404.
  expect([204, 404]).toContain(res.status());
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
  const { backendBaseUrl } = getTestEnv();
  const res = await request.post(`${backendBaseUrl}/api/assets/${encodeURIComponent(assetId)}/copy`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { newAssetName },
  });
  expect(res.ok()).toBeTruthy();
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
