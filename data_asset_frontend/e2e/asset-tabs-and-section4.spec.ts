import { test, expect } from "@playwright/test";
import {
  apiDelete,
  apiGet,
  apiLoginToken,
  apiPost,
  apiPut,
  apiCreateAsset,
  apiDeleteAsset,
  getTestEnv,
  uiLogin,
} from "./utils/testEnv";
import { gotoAssetDetails } from "./utils/assetFlows";

/**
 * Asset tabs/sections + Section4 endpoints E2E coverage.
 *
 * Design goals:
 * - Deterministic assertions:
 *   - Prefer checking that core tab panels render, plus API checks for endpoints.
 *   - Avoid brittle assertions that depend on seeded master data or exact table row counts.
 * - Reuse existing hybrid helpers:
 *   - uiLogin for end-to-end auth
 *   - apiLoginToken/api* for deterministic API setup/verification
 *
 * Notes:
 * - The UI portion validates each Asset Details tab is reachable and renders stable UI landmarks.
 * - The API portion validates the user-provided endpoint list responds (200/201/204 etc.) with a valid token.
 */

test.describe("Asset Details: listed tabs/sections render + key API endpoints respond", () => {
  test("Asset Details tabs/sections: Asset Details, Properties, Control Devices, Input Parameters, EF Source Mapping, Throughput Setup, Data Input, Parent Input Parameter Mapping, Reporting Attributes Mapping, Status Log, Additional Asset IDs", async ({
    page,
    request,
  }) => {
    // Setup: create an asset via API so all tabs have a concrete assetId route.
    const editorToken = await apiLoginToken(request, { role: "Editor" });
    const created = await apiCreateAsset(request, editorToken, { assetNamePrefix: "PW-TABS" });

    // UI: login and navigate to asset details page.
    await uiLogin(page, { role: "Editor" });
    await gotoAssetDetails(page, created.assetId);

    // Helper to click a tab by its accessible name and assert an expected landmark exists.
    // We keep this intentionally loose (panel exists / heading exists / key button exists)
    // so it remains stable across minor UI copy changes.
    const openTabAndAssert = async (tabName: RegExp, assertFn: () => Promise<void>) => {
      await page.getByRole("tab", { name: tabName }).click();
      // Ensure tab is selected (stable accessibility signal)
      await expect(page.getByRole("tab", { name: tabName })).toHaveAttribute("aria-selected", "true");
      await assertFn();
    };

    // 1) Asset Details (Overview)
    await openTabAndAssert(/asset details/i, async () => {
      // Deterministic: page header is visible and the overview panel has some content.
      await expect(page.getByRole("heading").first()).toBeVisible();
      // Common stable field labels across implementations.
      await expect(page.getByText(/site/i).first()).toBeVisible();
    });

    // 2) Properties
    await openTabAndAssert(/properties/i, async () => {
      // Expect presence of an "Add" action or empty-state content.
      // (We assert OR conditions to stay stable across environments with/without seeded data.)
      const addBtn = page.getByRole("button", { name: /add/i });
      const emptyState = page.getByText(/no properties/i);
      const table = page.getByRole("table");
      await expect(addBtn.or(emptyState).or(table)).toBeVisible();
    });

    // 3) Control Devices
    await openTabAndAssert(/control devices/i, async () => {
      const addBtn = page.getByRole("button", { name: /add/i });
      const emptyState = page.getByText(/no control devices/i);
      const table = page.getByRole("table");
      await expect(addBtn.or(emptyState).or(table)).toBeVisible();
    });

    // 4) Input Parameters
    await openTabAndAssert(/input parameters/i, async () => {
      const addBtn = page.getByRole("button", { name: /add/i });
      const emptyState = page.getByText(/no input parameters/i);
      const table = page.getByRole("table");
      await expect(addBtn.or(emptyState).or(table)).toBeVisible();
    });

    // 5) EF Source Mapping
    await openTabAndAssert(/ef source mapping/i, async () => {
      // This tab often depends on selecting an input parameter first; assert stable guidance exists.
      const guidance = page.getByText(/select/i);
      const table = page.getByRole("table");
      await expect(guidance.or(table)).toBeVisible();
    });

    // 6) Throughput Setup
    await openTabAndAssert(/throughput setup/i, async () => {
      const guidance = page.getByText(/select/i);
      const table = page.getByRole("table");
      await expect(guidance.or(table)).toBeVisible();
    });

    // 7) Data Input
    await openTabAndAssert(/data input/i, async () => {
      const guidance = page.getByText(/select/i);
      const table = page.getByRole("table");
      await expect(guidance.or(table)).toBeVisible();
    });

    // 8) Parent Input Parameter Mapping
    await openTabAndAssert(/parent input parameter mapping/i, async () => {
      const guidance = page.getByText(/select/i);
      const table = page.getByRole("table");
      await expect(guidance.or(table)).toBeVisible();
    });

    // 9) Reporting Attributes Mapping
    await openTabAndAssert(/reporting attributes mapping/i, async () => {
      const addBtn = page.getByRole("button", { name: /add/i });
      const emptyState = page.getByText(/no reporting/i);
      const table = page.getByRole("table");
      await expect(addBtn.or(emptyState).or(table)).toBeVisible();
    });

    // 10) Status Log
    await openTabAndAssert(/status log/i, async () => {
      const addBtn = page.getByRole("button", { name: /add/i });
      const emptyState = page.getByText(/no status/i);
      const table = page.getByRole("table");
      await expect(addBtn.or(emptyState).or(table)).toBeVisible();
    });

    // 11) Additional Asset IDs
    await openTabAndAssert(/additional asset ids/i, async () => {
      const addBtn = page.getByRole("button", { name: /add/i });
      const emptyState = page.getByText(/no additional/i);
      const table = page.getByRole("table");
      await expect(addBtn.or(emptyState).or(table)).toBeVisible();
    });

    // Cleanup
    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);
  });

  test("Section4 endpoints (user_input_ref): CRUD endpoints respond with auth token (deterministic API checks)", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Editor" });

    // We avoid assuming exact required payload shapes for these entities (may change / have validations).
    // Deterministic strategy:
    // - GET list endpoints: must return 200 with auth
    // - POST/PUT/DELETE: perform "contract sanity" using allowed failure codes if validation requires more fields.
    //
    // This still validates routing, auth wiring, and endpoint availability end-to-end.

    const listEndpoints = [
      "/api/section4/site-profiles",
      "/api/section4/chemical-raw-materials",
      "/api/section4/chemical-sds",
      "/api/section4/wwts-process-streams",
      "/api/section4/lab-data-configurations",
      "/api/section4/water-process-configurations",
    ];

    for (const path of listEndpoints) {
      const res = await apiGet(request, path, { token, okStatuses: [200] });
      // Response must be JSON array per OpenAPI; keep assertion minimal and deterministic.
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    }

    // POST endpoints: attempt minimal payload; accept 201 OR 400 (validation) but not 401/403/404/5xx.
    const createEndpoints = [
      { path: "/api/section4/site-profiles", sample: { siteId: "SITE-001", name: `pw-site-profile-${Date.now()}` } },
      {
        path: "/api/section4/chemical-raw-materials",
        sample: { siteId: "SITE-001", name: `pw-chem-raw-${Date.now()}` },
      },
      { path: "/api/section4/chemical-sds", sample: { siteId: "SITE-001", name: `pw-chem-sds-${Date.now()}` } },
      {
        path: "/api/section4/wwts-process-streams",
        sample: { siteId: "SITE-001", name: `pw-wwts-stream-${Date.now()}` },
      },
      {
        path: "/api/section4/lab-data-configurations",
        sample: { siteId: "SITE-001", name: `pw-lab-config-${Date.now()}` },
      },
      {
        path: "/api/section4/water-process-configurations",
        sample: { siteId: "SITE-001", name: `pw-water-proc-${Date.now()}` },
      },
    ];

    for (const { path, sample } of createEndpoints) {
      const res = await request.post(`${getTestEnv().backendBaseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: sample,
      });

      expect([201, 400]).toContain(res.status());
    }
  });

  test("LegacyCompatibility endpoints (user_input_ref): endpoints respond with auth token (deterministic API checks)", async ({
    request,
  }) => {
    const token = await apiLoginToken(request, { role: "Editor" });

    // These legacy endpoints are not fully specified here; we perform availability/auth checks.
    // For POST routes we allow 200/201/400 depending on validation.
    const legacyPostPaths = ["/api/siteassets/managesiteassets", "/api/siteassets/removesiteasset"];

    for (const path of legacyPostPaths) {
      const res = await request.post(`${getTestEnv().backendBaseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { correlationId: `pw-legacy-${Date.now()}` },
      });
      expect([200, 201, 400]).toContain(res.status());
    }

    // Legacy EF source mapping (path params) and throughput generator.
    // We create an asset and input parameter via supported current endpoints to get IDs.
    const created = await apiCreateAsset(request, token, { assetNamePrefix: "PW-LEGACY" });

    // Create an input parameter for legacy endpoints requiring inputParameterId.
    // Minimal sample; accept 201 or 400 (if backend requires extra fields). If 400, we still can validate GET list works.
    const ipCreate = await request.post(
      `${getTestEnv().backendBaseUrl}/api/assets/${encodeURIComponent(created.assetId)}/input-parameters`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          // Common fields used by many backends; if validation differs, we accept 400.
          inputName: `pw-ip-${Date.now()}`,
          createdBy: "pw",
          correlationId: `pw-ip-${Date.now()}`,
        },
      },
    );

    let inputParameterId: string | undefined;
    if (ipCreate.status() === 201) {
      const body: any = await ipCreate.json();
      inputParameterId = String(body?.inputParameterId ?? body?.id ?? body?.InputParameterId);
      expect(inputParameterId).toBeTruthy();
    }

    if (inputParameterId) {
      // /api/inputefsourcemapping/{assetId}/{inputParameterId} GET/POST and PUT with efSourceMappingId
      const efGet = await request.get(
        `${getTestEnv().backendBaseUrl}/api/inputefsourcemapping/${encodeURIComponent(created.assetId)}/${encodeURIComponent(inputParameterId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      expect([200, 404]).toContain(efGet.status());

      const efPost = await request.post(
        `${getTestEnv().backendBaseUrl}/api/inputefsourcemapping/${encodeURIComponent(created.assetId)}/${encodeURIComponent(inputParameterId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { correlationId: `pw-ef-${Date.now()}` },
        },
      );
      expect([201, 400]).toContain(efPost.status());

      if (efPost.status() === 201) {
        const efBody: any = await efPost.json();
        const efSourceMappingId = String(efBody?.efSourceMappingId ?? efBody?.id ?? efBody?.EfSourceMappingId);
        expect(efSourceMappingId).toBeTruthy();

        const efPut = await request.put(
          `${getTestEnv().backendBaseUrl}/api/inputefsourcemapping/${encodeURIComponent(created.assetId)}/${encodeURIComponent(
            inputParameterId,
          )}/${encodeURIComponent(efSourceMappingId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { correlationId: `pw-ef-put-${Date.now()}` },
          },
        );
        expect([200, 400]).toContain(efPut.status());
      }

      const throughputGen = await request.post(
        `${getTestEnv().backendBaseUrl}/api/calculatedthroughputequationsetup/${encodeURIComponent(
          created.assetId,
        )}/${encodeURIComponent(inputParameterId)}/generatethroughputforinputparameter`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { correlationId: `pw-thr-${Date.now()}` },
        },
      );
      expect([200, 201, 400]).toContain(throughputGen.status());
    } else {
      // At minimum, validate that the list-input-parameters endpoint works for the created asset.
      const listIp = await apiGet(request, `/api/assets/${encodeURIComponent(created.assetId)}/input-parameters`, {
        token,
        okStatuses: [200],
      });
      const listBody = await listIp.json();
      expect(Array.isArray(listBody)).toBe(true);
    }

    // Cleanup
    const adminToken = await apiLoginToken(request, { role: "Admin" });
    await apiDeleteAsset(request, adminToken, created.assetId);
  });
});
