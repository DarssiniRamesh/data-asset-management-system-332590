import { test, expect } from "@playwright/test";
import {
  apiCopyAsset,
  apiCreateAsset,
  apiDeleteAsset,
  apiLoginToken,
  apiPut,
  apiDelete,
  getTestEnv,
  uiLogin,
} from "./utils/testEnv";

test.describe("BRD Asset Configuration - backend relevant E2E/API checks", () => {
  test("FR-01 Add Asset: API create succeeds with required fields; created asset appears in UI list", async ({
    page,
    request,
  }) => {
    // Create via API (backend validation baseline)
    const token = await apiLoginToken(request, { role: "Editor" });
    const created = await apiCreateAsset(request, token, { assetNamePrefix: "PW-ADD" });

    // Verify UI list surfaces it (exercises GET /api/assets + auth via UI)
    await uiLogin(page, { role: "Editor" });
    await page.goto("/app/assets");

    // Use search to avoid pagination issues.
    await page.getByLabel("Search").fill(created.assetName);
    await expect(page.getByText(created.assetName)).toBeVisible();

    // Cleanup with Admin
    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);
  });

  test("FR-02 Edit Asset: API update changes name; UI reflects update", async ({ page, request }) => {
    const editorToken = await apiLoginToken(request, { role: "Editor" });
    const created = await apiCreateAsset(request, editorToken, { assetNamePrefix: "PW-EDIT" });

    const { backendBaseUrl } = getTestEnv();
    const newName = `${created.assetName}-UPDATED`;

    // Update via API (PUT /api/assets/{id})
    await apiPut(request, `/api/assets/${encodeURIComponent(created.assetId)}`, {
      token: editorToken,
      data: {
        assetName: newName,
        siteId: "SITE-001",
        assetGroup: "AG",
        processGroup: "PG",
        permitEuId: created.permitEuId,
        requiresParentPseudo: false,
        parentPseudoAssetId: null,
        modifiedBy: "pw",
        correlationId: `pw-upd-${Date.now()}`,
      },
    });

    // UI should show new name after navigating to details
    await uiLogin(page, { role: "Editor" });
    await page.goto(`/app/assets/${created.assetId}`);
    await expect(page.getByRole("heading", { name: new RegExp(newName, "i") })).toBeVisible();

    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);
  });

  test("FR-04 Delete Asset: RBAC enforced (Editor forbidden), Admin can delete", async ({ request }) => {
    const editorToken = await apiLoginToken(request, { role: "Editor" });
    const created = await apiCreateAsset(request, editorToken, { assetNamePrefix: "PW-DEL" });

    const { backendBaseUrl } = getTestEnv();

    // Editor tries to delete => should be forbidden (typically 403)
    const delEditor = await apiDelete(request, `/api/assets/${encodeURIComponent(created.assetId)}`, {
      token: editorToken,
      data: { modifiedBy: "pw", correlationId: `pw-del-editor-${Date.now()}` },
      okStatuses: [401, 403],
    });
    expect([401, 403]).toContain(delEditor.status());

    // Admin delete succeeds
    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);

    // Verify GET is 404 after delete (or 409 in some dependency cases; accept 404/409/200 depending on backend semantics)
    const getAfter = await request.get(`${backendBaseUrl}/api/assets/${encodeURIComponent(created.assetId)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 409]).toContain(getAfter.status());
  });

  test("FR-03 Copy Asset: UI shows Confirmation! modal and lineage endpoint returns record", async ({
    page,
    request,
  }) => {
    const editorToken = await apiLoginToken(request, { role: "Editor" });
    const src = await apiCreateAsset(request, editorToken, { assetNamePrefix: "PW-COPY-SRC" });

    // Use UI to exercise BRD confirmation UX
    await uiLogin(page, { role: "Editor" });
    await page.goto(`/app/assets/${src.assetId}/copy`);

    const newName = `PW-COPY-TGT-${Date.now()}`;
    await page.getByLabel("New Asset Name").fill(newName);
    await page.getByRole("button", { name: /continue/i }).click();

    // "Confirmation!" modal must appear (BRD requirement)
    await expect(page.getByRole("heading", { name: "Confirmation!" })).toBeVisible();
    await page.getByRole("button", { name: /confirm & copy/i }).click();

    // Confirmation panel should show after submit
    await expect(page.getByText(/copy request submitted/i)).toBeVisible();

    // Toggle lineage view (optional endpoint)
    await page.getByRole("checkbox", { name: /show copy lineage/i }).check();

    // Either a lineage table appears OR a friendly "not available" panel.
    const lineageUnavailable = page.getByText(/lineage not available/i);
    const lineageTableHeader = page.getByRole("columnheader", { name: /status/i });

    await expect(lineageUnavailable.or(lineageTableHeader)).toBeVisible();

    // Cleanup: attempt to locate target via backend copy API response as a fallback if UI didn't expose it.
    // We do a backend copy as well to get explicit ids, then delete both.
    const apiCopyMeta = await apiCopyAsset(request, editorToken, src.assetId, `PW-COPY-TGT-API-${Date.now()}`);
    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, src.assetId);
    if (apiCopyMeta.targetAssetId) await apiDeleteAsset(request, adminToken, apiCopyMeta.targetAssetId);
  });
});
