import { test, expect } from "@playwright/test";
import {
  apiDelete,
  apiGet,
  apiLoginToken,
  apiPost,
  apiPut,
  apiCreateAsset,
  apiDeleteAsset,
} from "./utils/testEnv";

/**
 * Section4 + LegacyCompatibility API E2E (API-only) tests
 *
 * Authoritative endpoint list (from user_input_ref):
 *
 * Section4:
 *  - GET    /api/section4/site-profiles
 *  - POST   /api/section4/site-profiles
 *  - PUT    /api/section4/site-profiles/{siteProfileId}
 *  - DELETE /api/section4/site-profiles/{siteProfileId}
 *
 *  - GET    /api/section4/chemical-raw-materials
 *  - POST   /api/section4/chemical-raw-materials
 *  - PUT    /api/section4/chemical-raw-materials/{chemicalRawMaterialId}
 *  - DELETE /api/section4/chemical-raw-materials/{chemicalRawMaterialId}
 *
 *  - GET    /api/section4/chemical-sds
 *  - POST   /api/section4/chemical-sds
 *  - PUT    /api/section4/chemical-sds/{chemicalSdsId}
 *  - DELETE /api/section4/chemical-sds/{chemicalSdsId}
 *
 *  - GET    /api/section4/wwts-process-streams
 *  - POST   /api/section4/wwts-process-streams
 *  - PUT    /api/section4/wwts-process-streams/{wwtsProcessStreamId}
 *  - DELETE /api/section4/wwts-process-streams/{wwtsProcessStreamId}
 *
 *  - GET    /api/section4/lab-data-configurations
 *  - POST   /api/section4/lab-data-configurations
 *  - PUT    /api/section4/lab-data-configurations/{labDataConfigurationId}
 *  - DELETE /api/section4/lab-data-configurations/{labDataConfigurationId}
 *
 *  - GET    /api/section4/water-process-configurations
 *  - POST   /api/section4/water-process-configurations
 *  - PUT    /api/section4/water-process-configurations/{waterProcessConfigurationId}
 *  - DELETE /api/section4/water-process-configurations/{waterProcessConfigurationId}
 *
 * LegacyCompatibility:
 *  - POST /api/siteassets/managesiteassets
 *  - POST /api/siteassets/removesiteasset
 *  - POST /api/inputefsourcemapping/{assetId}/{inputParameterId}
 *  - GET  /api/inputefsourcemapping/{assetId}/{inputParameterId}
 *  - PUT  /api/inputefsourcemapping/{assetId}/{inputParameterId}/{efSourceMappingId}
 *  - POST /api/calculatedthroughputequationsetup/{assetId}/{inputParameterId}/generatethroughputforinputparameter
 *
 * Determinism/rerun strategy:
 * - Every created entity uses a unique correlationId and a unique name (timestamp + random suffix).
 * - Each test cleans up the asset it created; Section4 rows are deleted when possible.
 * - We *do not* assume any pre-seeded inputParameterId (previous failures used `1`); we create our own.
 */

function uniqueKey(prefix: string): string {
  // Date.now() alone can collide in fast parallel runs; add random suffix for safety.
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function safeJson(res: any): Promise<any> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

type CrudCase = {
  name: string;
  listPath: string;
  createPath: string;
  idField: string;
  updatePath: (id: string) => string;
  deletePath: (id: string) => string;
  createBody: () => Record<string, unknown>;
  updateBody: (created: Record<string, unknown>) => Record<string, unknown>;
};

test.describe("Section4 API - CRUD (GET/POST/PUT/DELETE) via Playwright request context", () => {
  /**
   * Payloads here are aligned to OpenAPI (backend_openapi.runtime.downloaded.json):
   * - CreateChemicalRawMaterialRequest requires: siteId, chemicalName, createdBy, correlationId
   * - CreateChemicalSdsRequest requires: siteId, chemicalName, createdBy, correlationId
   * - CreateWwtsProcessStreamRequest requires: siteId, streamName, createdBy, correlationId
   * - CreateLabDataConfigurationRequest requires: siteId, configurationName, createdBy, correlationId
   * - CreateWaterProcessConfigurationRequest requires: siteId, configurationName, createdBy, correlationId
   * - CreateSiteProfileRequest requires: siteId, createdBy, correlationId
   */
  const cases: CrudCase[] = [
    {
      name: "site-profiles",
      listPath: "/api/section4/site-profiles?siteId=SITE-001&limit=50",
      createPath: "/api/section4/site-profiles",
      idField: "siteProfileId",
      updatePath: (id) => `/api/section4/site-profiles/${encodeURIComponent(id)}`,
      deletePath: (id) => `/api/section4/site-profiles/${encodeURIComponent(id)}`,
      createBody: () => ({
        siteId: "SITE-001",
        createdBy: "pw",
        correlationId: uniqueKey("pw-s4-sp-create"),
      }),
      updateBody: (created) => ({
        siteId: created.siteId ?? "SITE-001",
        modifiedBy: "pw",
        correlationId: uniqueKey("pw-s4-sp-update"),
      }),
    },
    {
      name: "chemical-raw-materials",
      listPath: "/api/section4/chemical-raw-materials?siteId=SITE-001&limit=50",
      createPath: "/api/section4/chemical-raw-materials",
      idField: "chemicalRawMaterialId",
      updatePath: (id) => `/api/section4/chemical-raw-materials/${encodeURIComponent(id)}`,
      deletePath: (id) => `/api/section4/chemical-raw-materials/${encodeURIComponent(id)}`,
      createBody: () => ({
        siteId: "SITE-001",
        chemicalName: `PW Chemical ${uniqueKey("CRM")}`,
        createdBy: "pw",
        correlationId: uniqueKey("pw-s4-crm-create"),
      }),
      updateBody: (created) => ({
        siteId: created.siteId ?? "SITE-001",
        chemicalName: `${created.chemicalName ?? "PW Chemical"} UPDATED ${uniqueKey("CRM")}`,
        modifiedBy: "pw",
        correlationId: uniqueKey("pw-s4-crm-update"),
      }),
    },
    {
      name: "chemical-sds",
      listPath: "/api/section4/chemical-sds?siteId=SITE-001&limit=50",
      createPath: "/api/section4/chemical-sds",
      idField: "chemicalSdsId",
      updatePath: (id) => `/api/section4/chemical-sds/${encodeURIComponent(id)}`,
      deletePath: (id) => `/api/section4/chemical-sds/${encodeURIComponent(id)}`,
      createBody: () => ({
        siteId: "SITE-001",
        chemicalName: `PW SDS Chemical ${uniqueKey("SDS")}`,
        createdBy: "pw",
        correlationId: uniqueKey("pw-s4-sds-create"),
      }),
      updateBody: (created) => ({
        siteId: created.siteId ?? "SITE-001",
        chemicalName: `${created.chemicalName ?? "PW SDS Chemical"} UPDATED ${uniqueKey("SDS")}`,
        modifiedBy: "pw",
        correlationId: uniqueKey("pw-s4-sds-update"),
      }),
    },
    {
      name: "wwts-process-streams",
      listPath: "/api/section4/wwts-process-streams?siteId=SITE-001&limit=50",
      createPath: "/api/section4/wwts-process-streams",
      idField: "wwtsProcessStreamId",
      updatePath: (id) => `/api/section4/wwts-process-streams/${encodeURIComponent(id)}`,
      deletePath: (id) => `/api/section4/wwts-process-streams/${encodeURIComponent(id)}`,
      createBody: () => ({
        siteId: "SITE-001",
        streamName: `PW Stream ${uniqueKey("STR")}`,
        createdBy: "pw",
        correlationId: uniqueKey("pw-s4-wwts-create"),
      }),
      updateBody: (created) => ({
        siteId: created.siteId ?? "SITE-001",
        streamName: `${created.streamName ?? "PW Stream"} UPDATED ${uniqueKey("STR")}`,
        modifiedBy: "pw",
        correlationId: uniqueKey("pw-s4-wwts-update"),
      }),
    },
    {
      name: "lab-data-configurations",
      listPath: "/api/section4/lab-data-configurations?siteId=SITE-001&limit=50",
      createPath: "/api/section4/lab-data-configurations",
      idField: "labDataConfigurationId",
      updatePath: (id) => `/api/section4/lab-data-configurations/${encodeURIComponent(id)}`,
      deletePath: (id) => `/api/section4/lab-data-configurations/${encodeURIComponent(id)}`,
      createBody: () => ({
        siteId: "SITE-001",
        configurationName: `PW Lab Config ${uniqueKey("LABCFG")}`,
        createdBy: "pw",
        correlationId: uniqueKey("pw-s4-labcfg-create"),
      }),
      updateBody: (created) => ({
        siteId: created.siteId ?? "SITE-001",
        configurationName: `${created.configurationName ?? "PW Lab Config"} UPDATED ${uniqueKey("LABCFG")}`,
        modifiedBy: "pw",
        correlationId: uniqueKey("pw-s4-labcfg-update"),
      }),
    },
    {
      name: "water-process-configurations",
      listPath: "/api/section4/water-process-configurations?siteId=SITE-001&limit=50",
      createPath: "/api/section4/water-process-configurations",
      idField: "waterProcessConfigurationId",
      updatePath: (id) => `/api/section4/water-process-configurations/${encodeURIComponent(id)}`,
      deletePath: (id) => `/api/section4/water-process-configurations/${encodeURIComponent(id)}`,
      createBody: () => ({
        siteId: "SITE-001",
        configurationName: `PW Water Config ${uniqueKey("WATERCFG")}`,
        createdBy: "pw",
        correlationId: uniqueKey("pw-s4-watercfg-create"),
      }),
      updateBody: (created) => ({
        siteId: created.siteId ?? "SITE-001",
        configurationName: `${created.configurationName ?? "PW Water Config"} UPDATED ${uniqueKey("WATERCFG")}`,
        modifiedBy: "pw",
        correlationId: uniqueKey("pw-s4-watercfg-update"),
      }),
    },
  ];

  for (const c of cases) {
    test(`${c.name}: list + create-update-delete`, async ({ request }) => {
      const token = await apiLoginToken(request, { role: "Admin" });

      // LIST should succeed for Admin in normal environments.
      const listRes = await apiGet(request, c.listPath, { token, okStatuses: [200] });
      const list = await safeJson(listRes);
      expect(Array.isArray(list), `Expected array response from GET ${c.listPath}`).toBe(true);

      // CREATE should succeed with required fields present.
      const createRes = await apiPost(request, c.createPath, { token, data: c.createBody() });
      expect([200, 201].includes(createRes.status()), `Expected 200/201 from POST ${c.createPath}`).toBe(true);

      const created = (await safeJson(createRes)) as Record<string, unknown>;
      expect(created && created[c.idField] !== undefined, `Expected ${c.idField} on create response`).toBeTruthy();
      const createdId = String(created[c.idField]);

      // UPDATE should succeed.
      const updateRes = await apiPut(request, c.updatePath(createdId), { token, data: c.updateBody(created) });
      expect([200].includes(updateRes.status()), `Expected 200 from PUT ${c.updatePath(createdId)}`).toBe(true);

      // DELETE should succeed (204 typical).
      const deleteRes = await apiDelete(request, c.deletePath(createdId), {
        token,
        // OpenAPI uses DeleteAssetRequest for deletes in Section4; it requires modifiedBy + correlationId.
        data: { modifiedBy: "pw", correlationId: uniqueKey("pw-s4-del") },
        okStatuses: [200, 202, 204],
      });
      expect([200, 202, 204].includes(deleteRes.status())).toBe(true);
    });
  }
});

async function seedAssetAndInputParameter(request: any, token: string): Promise<{
  assetId: string;
  inputParameterId: string;
}> {
  /**
   * Legacy endpoints require an assetId and an inputParameterId, and tests must not assume pre-seeded data.
   * We create both, then caller cleans up asset at the end (deleting asset should cascade/soft-delete children).
   *
   * Backend validation note:
   * - When inUseFlag=true, backend requires uomId and reportingProgramId.
   *   Therefore we fetch a valid uomId and reportingProgramId from masters endpoints and include them.
   */
  const asset = await apiCreateAsset(request, token, { assetNamePrefix: "PW-LEGACY" });

  // Fetch valid master IDs (limit=1 is enough).
  const uomsRes = await apiGet(request, "/api/masters/uoms?ActiveOnly=true&Limit=1", { token, okStatuses: [200] });
  const uoms = (await safeJson(uomsRes)) as any[];
  expect(Array.isArray(uoms) && uoms.length > 0, "Expected at least one UOM from /api/masters/uoms").toBe(true);
  const uomId = uoms[0]?.uomId ?? uoms[0]?.UomId;
  expect(uomId !== undefined && uomId !== null, "Expected uomId field on UOM master").toBeTruthy();

  const programsRes = await apiGet(request, "/api/masters/reporting-programs?ActiveOnly=true&Limit=1", {
    token,
    okStatuses: [200],
  });
  const programs = (await safeJson(programsRes)) as any[];
  expect(
    Array.isArray(programs) && programs.length > 0,
    "Expected at least one reporting program from /api/masters/reporting-programs",
  ).toBe(true);
  const reportingProgramId = programs[0]?.reportingProgramId ?? programs[0]?.ReportingProgramId;
  expect(
    reportingProgramId !== undefined && reportingProgramId !== null,
    "Expected reportingProgramId field on reporting program master",
  ).toBeTruthy();

  // Create an input parameter for the asset using OpenAPI-required fields + required master refs.
  const createInputParameterRes = await apiPost(
    request,
    `/api/assets/${encodeURIComponent(asset.assetId)}/input-parameters`,
    {
      token,
      data: {
        inputParameterName: `PW Input Param ${uniqueKey("IP")}`,
        inputType: "Text",
        dataEntryFrequency: "Monthly",
        inUseFlag: true,
        uomId: Number(uomId),
        reportingProgramId: Number(reportingProgramId),
        createdBy: "pw",
        correlationId: uniqueKey("pw-ip-create"),
      },
    },
  );
  expect([200, 201].includes(createInputParameterRes.status())).toBe(true);

  const inputParameter = (await safeJson(createInputParameterRes)) as { inputParameterId: number | string };
  expect(inputParameter?.inputParameterId !== undefined).toBeTruthy();

  return { assetId: asset.assetId, inputParameterId: String(inputParameter.inputParameterId) };
}

test.describe("LegacyCompatibility API endpoints via Playwright request context", () => {
  test("POST /api/siteassets/managesiteassets (create mode)", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    // ManageSiteAssetsRequest requires `mode`; for create it also needs a `create` payload shaped like CreateAssetRequest.
    const ts = Date.now();
    const res = await apiPost(request, "/api/siteassets/managesiteassets", {
      token,
      data: {
        mode: "create",
        create: {
          siteId: "SITE-001",
          assetGroup: "AG",
          processGroup: "PG",
          assetName: `PW-MANAGE-${ts}`,
          permitEuId: `PW-MANAGE-PERMIT-${ts}`,
          globalUniqueAssetId: `PW-MANAGE-GUA-${ts}`,
          requiresParentPseudo: false,
          parentPseudoAssetId: null,
          createdBy: "pw",
          correlationId: uniqueKey("pw-legacy-manage-create"),
        },
      },
    });

    expect([200, 201].includes(res.status())).toBe(true);
    // Note: we don't delete this created asset because response shape isn't guaranteed to include assetId.
    // This endpoint is legacy and may or may not persist depending on implementation; keep test minimal.
  });

  test("POST /api/siteassets/removesiteasset (requires assetId)", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const asset = await apiCreateAsset(request, token, { assetNamePrefix: "PW-REMOVE" });
    try {
      const res = await apiPost(request, "/api/siteassets/removesiteasset", {
        token,
        data: {
          assetId: Number(asset.assetId),
          modifiedBy: "pw",
          correlationId: uniqueKey("pw-legacy-remove"),
        },
      });

      // Expected to remove/soft-delete; backend may return 200/204.
      expect([200, 202, 204].includes(res.status())).toBe(true);
    } finally {
      // Ensure rerunnable even if remove endpoint did nothing or already removed.
      await apiDeleteAsset(request, token, asset.assetId);
    }
  });

  test("Legacy input EF source mapping: POST/GET/PUT works (with seeded asset + input parameter)", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const { assetId, inputParameterId } = await seedAssetAndInputParameter(request, token);

    try {
      // CreateEfSourceMappingRequest requires: efSourceSetOrTable, createdBy, correlationId
      const createRes = await apiPost(
        request,
        `/api/inputefsourcemapping/${encodeURIComponent(assetId)}/${encodeURIComponent(inputParameterId)}`,
        {
          token,
          data: {
            efSourceSetOrTable: `PW-EF-${uniqueKey("SRC")}`,
            createdBy: "pw",
            correlationId: uniqueKey("pw-legacy-ef-create"),
          },
        },
      );
      expect([200, 201].includes(createRes.status())).toBe(true);

      const listRes = await apiGet(
        request,
        `/api/inputefsourcemapping/${encodeURIComponent(assetId)}/${encodeURIComponent(inputParameterId)}`,
        { token, okStatuses: [200] },
      );
      const list = await safeJson(listRes);
      expect(Array.isArray(list), "Expected array of EfSourceMappingDto").toBe(true);

      const first = (list as any[])[0];
      expect(first?.efSourceMappingId !== undefined).toBeTruthy();

      // UpdateEfSourceMappingRequest requires: efSourceSetOrTable, modifiedBy, correlationId
      const updateRes = await apiPut(
        request,
        `/api/inputefsourcemapping/${encodeURIComponent(assetId)}/${encodeURIComponent(inputParameterId)}/${encodeURIComponent(
          String(first.efSourceMappingId),
        )}`,
        {
          token,
          data: {
            efSourceSetOrTable: `${first.efSourceSetOrTable ?? "PW-EF"}-UPDATED-${uniqueKey("SRC")}`,
            modifiedBy: "pw",
            correlationId: uniqueKey("pw-legacy-ef-update"),
          },
        },
      );
      expect(updateRes.status()).toBe(200);
    } finally {
      await apiDeleteAsset(request, token, assetId);
    }
  });

  test("POST /api/calculatedthroughputequationsetup/{assetId}/{inputParameterId}/generatethroughputforinputparameter (with seeded input parameter)", async ({
    request,
  }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const { assetId, inputParameterId } = await seedAssetAndInputParameter(request, token);

    try {
      // This endpoint uses CreateThroughputEquationRequest as request body (per OpenAPI).
      // We need a valid masterEquationId; pull one from /api/masters/equations.
      const eqListRes = await apiGet(request, "/api/masters/equations?ActiveOnly=true&Limit=1", {
        token,
        okStatuses: [200],
      });
      const equations = await safeJson(eqListRes);
      expect(Array.isArray(equations) && equations.length > 0).toBe(true);

      const masterEquationId =
        equations[0]?.equationMasterId ?? equations[0]?.masterEquationId ?? equations[0]?.EquationMasterId;
      expect(masterEquationId !== undefined && masterEquationId !== null).toBeTruthy();

      const res = await apiPost(
        request,
        `/api/calculatedthroughputequationsetup/${encodeURIComponent(assetId)}/${encodeURIComponent(
          inputParameterId,
        )}/generatethroughputforinputparameter`,
        {
          token,
          data: {
            masterEquationId: Number(masterEquationId),
            generatedEquation: `PW-GEN-EQ-${uniqueKey("EQ")}`,
            reportingYear: new Date().getFullYear(),
            createdBy: "pw",
            correlationId: uniqueKey("pw-legacy-throughput"),
          },
        },
      );

      expect([200, 201].includes(res.status())).toBe(true);
    } finally {
      await apiDeleteAsset(request, token, assetId);
    }
  });
});
