import { test, expect } from "@playwright/test";
import { apiCreateAsset, apiLoginToken, apiDeleteAsset, getTestEnv, uiLogin } from "./utils/testEnv";

const CORRELATION_HEADER = "x-correlation-id";

/**
 * These tests validate correlation-id propagation (and therefore observability/audit traceability)
 * using a hybrid UI+API approach:
 *  - UI drives authenticated browser flows (real user interaction).
 *  - API calls validate deterministic network-level behavior like response headers.
 *
 * Backend contract (per CorrelationIdMiddleware.cs):
 *  - Header name: X-Correlation-Id
 *  - If request includes a valid header value (regex: ^[a-zA-Z0-9._:-]{1,128}$), backend echoes it back.
 *  - If missing or invalid, backend generates a new 32-hex string and returns it in response header.
 */
test.describe("BRD Observability - correlation-id propagation (hybrid UI + API)", () => {
  test("Correlation ID is echoed back when provided and valid (API)", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Editor" });
    const { backendBaseUrl } = getTestEnv();

    // Valid per backend regex: letters/digits/._:- (<= 128 chars)
    const provided = `pw-valid.${Date.now()}:trace`;

    const res = await request.get(`${backendBaseUrl}/api/assets?Limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Correlation-Id": provided,
      },
    });

    // Either 200 or 503 depending on backend availability; correlation header should be set regardless
    // because middleware uses Response.OnStarting.
    expect([200, 503]).toContain(res.status());

    const echoed = res.headers()[CORRELATION_HEADER];
    expect(echoed, "backend must return X-Correlation-Id response header").toBeTruthy();
    expect(echoed).toBe(provided);
  });

  test("Correlation ID is replaced when header is missing or invalid (API)", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Editor" });
    const { backendBaseUrl } = getTestEnv();

    // 1) Missing header => backend generates one
    const resMissing = await request.get(`${backendBaseUrl}/api/assets?Limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 503]).toContain(resMissing.status());

    const generated1 = resMissing.headers()[CORRELATION_HEADER];
    expect(generated1).toBeTruthy();
    // Expected generated format: 32 hex chars (Guid.NewGuid().ToString("N"))
    expect(generated1).toMatch(/^[0-9a-f]{32}$/i);

    // 2) Invalid header => backend replaces it with a generated one (not equal to invalid)
    const invalid = "bad value with spaces";
    const resInvalid = await request.get(`${backendBaseUrl}/api/assets?Limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Correlation-Id": invalid,
      },
    });
    expect([200, 503]).toContain(resInvalid.status());

    const generated2 = resInvalid.headers()[CORRELATION_HEADER];
    expect(generated2).toBeTruthy();
    expect(generated2).toMatch(/^[0-9a-f]{32}$/i);
    expect(generated2).not.toBe(invalid);
  });

  test("UI-driven authenticated flow produces correlated API calls (UI triggers API; verify response headers)", async ({
    page,
    request,
  }) => {
    // Create an asset via API as test data
    const editorToken = await apiLoginToken(request, { role: "Editor" });
    const created = await apiCreateAsset(request, editorToken, { assetNamePrefix: "PW-CORR-UI" });

    // Use UI to authenticate and load the asset details page (triggers GET /api/assets/{id})
    await uiLogin(page, { role: "Editor" });

    // Capture the asset-details response and assert correlation header exists
    const detailsResponsePromise = page.waitForResponse((res) => {
      return (
        res.request().method() === "GET" &&
        res.url().includes(`/api/assets/${encodeURIComponent(created.assetId)}`)
      );
    });

    await page.goto(`/app/assets/${created.assetId}`);
    const detailsRes = await detailsResponsePromise;

    // Middleware should always set X-Correlation-Id
    const corr = detailsRes.headers()[CORRELATION_HEADER];
    expect(corr).toBeTruthy();
    // If UI doesn't provide a header, backend generates it; verify it looks like a generated value.
    expect(corr).toMatch(/^[0-9a-f]{32}$/i);

    // Cleanup
    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);
  });

  test("API pre-seeds correlation-id, UI action still gets a correlation-id response header (sanity observability check)", async ({
    page,
    request,
  }) => {
    // This test is intentionally conservative: it does NOT assume the browser forwards X-Correlation-Id,
    // but it validates we always get one back on a mutation that is observable/auditable.
    const editorToken = await apiLoginToken(request, { role: "Editor" });
    const created = await apiCreateAsset(request, editorToken, { assetNamePrefix: "PW-CORR-MUT" });

    await uiLogin(page, { role: "Editor" });
    await page.goto(`/app/assets/${created.assetId}/copy`);

    // Trigger the copy call and assert response has correlation header.
    const copyResPromise = page.waitForResponse((res) => {
      return (
        res.request().method() === "POST" &&
        res.url().includes(`/api/assets/${encodeURIComponent(created.assetId)}/copy`)
      );
    });

    await page.getByLabel("New Asset Name").fill(`PW-CORR-MUT-TGT-${Date.now()}`);
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("heading", { name: "Confirmation!" })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /confirm & copy/i }).click();
    const copyRes = await copyResPromise;

    // Copy can be 201 or 409 depending on environment uniqueness constraints,
    // but correlation header must be present in either case.
    expect([201, 409]).toContain(copyRes.status());

    const corr = copyRes.headers()[CORRELATION_HEADER];
    expect(corr).toBeTruthy();
    expect(corr).toMatch(/^[0-9a-f]{32}$/i);

    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);
  });
});
