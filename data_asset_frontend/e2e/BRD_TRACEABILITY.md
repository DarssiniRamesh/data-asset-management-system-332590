# BRD Traceability — Asset Configuration Feature (Playwright)

Authoritative requirements source:
- `attachments/BRD_-_Asset_Configuration_Feature.pdf` (extracted text via tooling)

This document maps BRD requirements to automated Playwright verification artifacts in:
- `data-asset-management-system-332590/data_asset_frontend/e2e/**`

## Requirement Inventory

The BRD provides explicit FR requirements and explicit cross-cutting requirements (audit/correlation ID, copy lineage, data quality rules). Where the BRD does not give an ID, we use the BRD’s own IDs (FR-01..FR-05) and assign additional IDs for cross-cutting sections:

- **AUD-01**: Correlation ID required for operations (BRD §6.11)
- **COPY-01**: Copy/lineage capture requirements (BRD §6.13)
- **DQ-01**: Data quality rules and acceptance thresholds (BRD §6.15)
- **BR-01**: Lifecycle + data capture rules (BRD §7)
- **LM-01**: Linked module requirements (BRD §8, copy replication expectations)

## Requirement Trace Matrix

| Req ID | Requirement | Source | Implementation Mapping | Inline Code Trace | Verification Mapping | Status | Notes |
|---|---|---|---|---|---|---|---|
| FR-01 | Add asset with required fields and persist; created asset visible | BRD §5 FR-01; §6.1 required fields | `e2e/utils/testEnv.ts: apiCreateAsset`, `e2e/brd-asset-configuration.spec.ts` | `e2e/utils/testEnv.ts` creates required-field payload | `e2e/brd-asset-configuration.spec.ts` test “FR-01 Add Asset…” | Implemented | Uses API create + UI list check for end-to-end |
| FR-02 | Edit asset; block save if validations fail / unsaved child rows | BRD §5 FR-02 | (Backend enforcement not fully exposed in UI tests) | N/A | Existing: `e2e/brd-asset-configuration.spec.ts` “FR-02 Edit Asset…” | Partial | UI child-row blocking not verified due to limited deterministic selectors/flows in current POC UI |
| FR-03 | Copy asset: create semantics; confirmation UX (Edit/Save), loader continuity; replication completeness; fallback hydration | BRD §5 FR-03; §6.13; §8.2 | `e2e/utils/assetFlows.ts`, `e2e/utils/testEnv.ts: apiCopyAsset`, `e2e/brd-asset-configuration.spec.ts` | `e2e/utils/assetFlows.ts` has REQ comments for FR-03 | `e2e/brd-asset-configuration.spec.ts` “FR-03 Copy Asset…” | Partial | Confirmation UI verified; replication completeness/fallback hydration not deterministically verifiable via public API in this repo snapshot |
| FR-04 | Delete requires confirmation; dependency-safe removal; refresh | BRD §5 FR-04 | `e2e/utils/testEnv.ts: apiDeleteAsset`, `e2e/brd-asset-configuration.spec.ts` | `apiDeleteAsset` uses correlation + modifiedBy | `e2e/brd-asset-configuration.spec.ts` “FR-04 Delete Asset…” | Partial | UI confirmation not exercised (API-only), but RBAC and delete behavior validated |
| FR-05 | Tab-level validation rules across tabs | BRD §5 FR-05; §6.2–6.10 | (Mostly UI validations) | N/A | New specs should cover (see TODOs) | Not Implemented | Requires deterministic UI element contracts for each tab’s required fields/errors |
| AUD-01 | Correlation ID required for traceability on operations | BRD §6.11 | `e2e/brd-correlation-id.spec.ts` | Correlation header assertions in tests | `e2e/brd-correlation-id.spec.ts` | Implemented | Valid/invalid header propagation verified |
| COPY-01 | Copy lineage must be queryable end-to-end | BRD §6.13; §7 | `e2e/brd-asset-configuration.spec.ts` checks `/api/asset-copy-lineage` response | In-spec commentary | `e2e/brd-asset-configuration.spec.ts` “FR-03 Copy Asset…” | Partial | Endpoint existence exercised; content completeness depends on environment |
| DQ-01 | Completeness/validity/uniqueness/consistency/traceability thresholds | BRD §6.15 | `e2e/utils/testEnv.ts` required-field payload; existing tests assert some uniqueness | In helper payload construction | Existing tests | Partial | Full domain validation not covered automatically without explicit UI error contracts |
| LM-01 | Linked module dependencies: EF source mapping, throughput setup, data input | BRD §8 | Not fully testable with current public API list endpoints from BRD snapshot | N/A | N/A | Unknown | Would require deterministic API endpoints for EF/throughput/data-input verification in this repo’s backend |

## Update Rules

1. When BRD changes: update rows first (Requirement + Source), then update tests. Do not change IDs (FR-xx) unless BRD changes them.
2. When tests are refactored: keep inline `REQ: <ID>` comments adjacent to the owning assertion/flow entrypoint.
3. When new deterministic UI selectors are introduced (recommended): add FR-05 coverage by asserting required-field errors per tab.
4. When backend exposes replication result endpoints or richer lineage fields: extend FR-03 / LM-01 verification and update Status to Implemented.

## Verification Artifacts Policy

Primary verification artifact:
- `CI=1 REACT_APP_FRONTEND_URL=<url> REACT_APP_BACKEND_URL=<url> npx playwright test`

Artifacts:
- `data_asset_frontend/playwright-report/**`
- `data_asset_frontend/test-results/**`
"""
