import { test, expect } from "@playwright/test";
import { apiGet, apiLoginToken, apiPost, apiPut } from "./utils/testEnv";

/**
 * Masters API E2E (API-only) tests
 *
 * Coverage:
 *  - POST /api/masters/uoms
 *  - GET  /api/masters/uoms
 *  - PUT  /api/masters/uoms/{uomId}
 *
 *  - POST /api/masters/reporting-programs
 *  - GET  /api/masters/reporting-programs
 *  - PUT  /api/masters/reporting-programs/{reportingProgramId}
 *
 *  - POST /api/masters/control-devices
 *  - GET  /api/masters/control-devices
 *  - PUT  /api/masters/control-devices/{controlDeviceId}
 *
 *  - POST /api/masters/equations
 *  - GET  /api/masters/equations
 *  - PUT  /api/masters/equations/{equationMasterId}
 *
 *  - POST /api/masters/status-codes
 *  - GET  /api/masters/status-codes
 *  - PUT  /api/masters/status-codes/{statusCodeId}
 *
 * Notes:
 *  - We intentionally don't delete masters here because the backend contract (from OpenAPI) only exposes POST/GET/PUT.
 *  - To keep the suite idempotent and avoid 409 conflicts, we generate unique keys per run.
 *  - We use Admin role token (masters administration is typically privileged).
 */

function uniqueKey(prefix: string): string {
  const ts = Date.now();
  return `${prefix}-${ts}`;
}

test.describe("Masters API - CRUD (POST/GET/PUT) via Playwright request context", () => {
  test("UOM masters: create, list, update", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const uomKey = uniqueKey("PW-UOM");
    const displayLabel = `Playwright UOM ${uomKey}`;

    const createRes = await apiPost(request, "/api/masters/uoms", {
      token,
      data: {
        uomKey,
        displayLabel,
        isActive: true,
        createdBy: "pw",
        correlationId: `pw-uom-create-${Date.now()}`,
      },
    });

    expect(createRes.status(), "Create UOM should return 201").toBe(201);
    const created = (await createRes.json()) as {
      uomId: number;
      uomKey: string;
      displayLabel: string;
      isActive: boolean;
    };

    expect(created.uomId).toBeTruthy();
    expect(created.uomKey).toBe(uomKey);
    expect(created.displayLabel).toBe(displayLabel);

    const listRes = await apiGet(request, "/api/masters/uoms?ActiveOnly=true&Limit=250", { token });
    const list = (await listRes.json()) as Array<{ uomId: number; uomKey: string; displayLabel: string }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((x) => x.uomId === created.uomId)).toBe(true);

    const updatedLabel = `${displayLabel} UPDATED`;
    const updateRes = await apiPut(request, `/api/masters/uoms/${encodeURIComponent(String(created.uomId))}`, {
      token,
      data: {
        uomKey,
        displayLabel: updatedLabel,
        isActive: true,
        modifiedBy: "pw",
        correlationId: `pw-uom-update-${Date.now()}`,
      },
    });

    expect(updateRes.status(), "Update UOM should return 200").toBe(200);
    const updated = (await updateRes.json()) as { uomId: number; displayLabel: string; uomKey: string };
    expect(updated.uomId).toBe(created.uomId);
    expect(updated.uomKey).toBe(uomKey);
    expect(updated.displayLabel).toBe(updatedLabel);
  });

  test("Reporting program masters: create, list, update", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const programKey = uniqueKey("PW-RP");
    const displayLabel = `Playwright Reporting Program ${programKey}`;

    const createRes = await apiPost(request, "/api/masters/reporting-programs", {
      token,
      data: {
        programKey,
        displayLabel,
        isActive: true,
        createdBy: "pw",
        correlationId: `pw-rp-create-${Date.now()}`,
      },
    });

    expect(createRes.status(), "Create reporting program should return 201").toBe(201);
    const created = (await createRes.json()) as {
      reportingProgramId: number;
      programKey: string;
      displayLabel: string;
      isActive: boolean;
    };

    expect(created.reportingProgramId).toBeTruthy();
    expect(created.programKey).toBe(programKey);
    expect(created.displayLabel).toBe(displayLabel);

    const listRes = await apiGet(request, "/api/masters/reporting-programs?ActiveOnly=true&Limit=250", { token });
    const list = (await listRes.json()) as Array<{
      reportingProgramId: number;
      programKey: string;
      displayLabel: string;
    }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((x) => x.reportingProgramId === created.reportingProgramId)).toBe(true);

    const updatedLabel = `${displayLabel} UPDATED`;
    const updateRes = await apiPut(
      request,
      `/api/masters/reporting-programs/${encodeURIComponent(String(created.reportingProgramId))}`,
      {
        token,
        data: {
          programKey,
          displayLabel: updatedLabel,
          isActive: true,
          modifiedBy: "pw",
          correlationId: `pw-rp-update-${Date.now()}`,
        },
      },
    );

    expect(updateRes.status(), "Update reporting program should return 200").toBe(200);
    const updated = (await updateRes.json()) as {
      reportingProgramId: number;
      programKey: string;
      displayLabel: string;
    };
    expect(updated.reportingProgramId).toBe(created.reportingProgramId);
    expect(updated.programKey).toBe(programKey);
    expect(updated.displayLabel).toBe(updatedLabel);
  });

  test("Control device masters: create, list, update", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const siteId = "SITE-001";
    const deviceKey = uniqueKey("PW-CD");
    const displayLabel = `Playwright Control Device ${deviceKey}`;

    const createRes = await apiPost(request, "/api/masters/control-devices", {
      token,
      data: {
        siteId,
        deviceKey,
        displayLabel,
        isActive: true,
        createdBy: "pw",
        correlationId: `pw-cd-create-${Date.now()}`,
      },
    });

    expect(createRes.status(), "Create control device should return 201").toBe(201);
    const created = (await createRes.json()) as {
      controlDeviceId: number;
      siteId: string;
      deviceKey: string;
      displayLabel: string;
      isActive: boolean;
    };

    expect(created.controlDeviceId).toBeTruthy();
    expect(created.siteId).toBe(siteId);
    expect(created.deviceKey).toBe(deviceKey);
    expect(created.displayLabel).toBe(displayLabel);

    const listRes = await apiGet(
      request,
      `/api/masters/control-devices?siteId=${encodeURIComponent(siteId)}&ActiveOnly=true&Limit=250`,
      { token },
    );
    const list = (await listRes.json()) as Array<{
      controlDeviceId: number;
      siteId: string;
      deviceKey: string;
      displayLabel: string;
    }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((x) => x.controlDeviceId === created.controlDeviceId)).toBe(true);

    const updatedLabel = `${displayLabel} UPDATED`;
    const updateRes = await apiPut(
      request,
      `/api/masters/control-devices/${encodeURIComponent(String(created.controlDeviceId))}`,
      {
        token,
        data: {
          siteId,
          deviceKey,
          displayLabel: updatedLabel,
          isActive: true,
          modifiedBy: "pw",
          correlationId: `pw-cd-update-${Date.now()}`,
        },
      },
    );

    expect(updateRes.status(), "Update control device should return 200").toBe(200);
    const updated = (await updateRes.json()) as {
      controlDeviceId: number;
      siteId: string;
      deviceKey: string;
      displayLabel: string;
    };
    expect(updated.controlDeviceId).toBe(created.controlDeviceId);
    expect(updated.siteId).toBe(siteId);
    expect(updated.deviceKey).toBe(deviceKey);
    expect(updated.displayLabel).toBe(updatedLabel);
  });

  test("Equation masters: create, list, update", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const equationKey = uniqueKey("PW-EQ");
    const versionLabel = "v1";

    // Backend contract (CreateEquationMasterRequest / UpdateEquationMasterRequest) expects:
    // effectiveFrom/effectiveTo: string with format "date" (YYYY-MM-DD), not date-time.
    const today = new Date();
    const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);
    const effectiveFrom = toIsoDate(today);

    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const effectiveTo = toIsoDate(oneYearFromNow);

    const createRes = await apiPost(request, "/api/masters/equations", {
      token,
      data: {
        equationKey,
        versionLabel,
        effectiveFrom,
        effectiveTo,
        createdBy: "pw",
        correlationId: `pw-eq-create-${Date.now()}`,
      },
    });

    expect(createRes.status(), "Create equation should return 201").toBe(201);
    const created = (await createRes.json()) as {
      equationMasterId: number;
      equationKey: string;
      versionLabel: string;
      effectiveFrom?: string | null;
      effectiveTo?: string | null;
    };

    expect(created.equationMasterId).toBeTruthy();
    expect(created.equationKey).toBe(equationKey);
    expect(created.versionLabel).toBe(versionLabel);

    const listRes = await apiGet(request, "/api/masters/equations?ActiveOnly=true&Limit=250", { token });
    const list = (await listRes.json()) as Array<{ equationMasterId: number; equationKey: string; versionLabel: string }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((x) => x.equationMasterId === created.equationMasterId)).toBe(true);

    const updatedVersion = "v2";
    const updateRes = await apiPut(
      request,
      `/api/masters/equations/${encodeURIComponent(String(created.equationMasterId))}`,
      {
        token,
        data: {
          equationKey,
          versionLabel: updatedVersion,
          effectiveFrom,
          effectiveTo,
          modifiedBy: "pw",
          correlationId: `pw-eq-update-${Date.now()}`,
        },
      },
    );

    expect(updateRes.status(), "Update equation should return 200").toBe(200);
    const updated = (await updateRes.json()) as { equationMasterId: number; equationKey: string; versionLabel: string };
    expect(updated.equationMasterId).toBe(created.equationMasterId);
    expect(updated.equationKey).toBe(equationKey);
    expect(updated.versionLabel).toBe(updatedVersion);
  });

  test("Status code masters: create, list, update", async ({ request }) => {
    const token = await apiLoginToken(request, { role: "Admin" });

    const statusCode = uniqueKey("PW-SC");
    const businessMeaning = `Playwright Status Code ${statusCode}`;

    const createRes = await apiPost(request, "/api/masters/status-codes", {
      token,
      data: {
        statusCode,
        businessMeaning,
        isActive: true,
        createdBy: "pw",
        correlationId: `pw-sc-create-${Date.now()}`,
      },
    });

    expect(createRes.status(), "Create status code should return 201").toBe(201);
    const created = (await createRes.json()) as {
      statusCodeId: number;
      statusCode: string;
      businessMeaning: string;
      isActive: boolean;
    };

    expect(created.statusCodeId).toBeTruthy();
    expect(created.statusCode).toBe(statusCode);
    expect(created.businessMeaning).toBe(businessMeaning);

    const listRes = await apiGet(request, "/api/masters/status-codes?ActiveOnly=true&Limit=250", { token });
    const list = (await listRes.json()) as Array<{ statusCodeId: number; statusCode: string; businessMeaning: string }>;
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((x) => x.statusCodeId === created.statusCodeId)).toBe(true);

    const updatedMeaning = `${businessMeaning} UPDATED`;
    const updateRes = await apiPut(
      request,
      `/api/masters/status-codes/${encodeURIComponent(String(created.statusCodeId))}`,
      {
        token,
        data: {
          statusCode,
          businessMeaning: updatedMeaning,
          isActive: true,
          modifiedBy: "pw",
          correlationId: `pw-sc-update-${Date.now()}`,
        },
      },
    );

    expect(updateRes.status(), "Update status code should return 200").toBe(200);
    const updated = (await updateRes.json()) as {
      statusCodeId: number;
      statusCode: string;
      businessMeaning: string;
    };
    expect(updated.statusCodeId).toBe(created.statusCodeId);
    expect(updated.statusCode).toBe(statusCode);
    expect(updated.businessMeaning).toBe(updatedMeaning);
  });
});
