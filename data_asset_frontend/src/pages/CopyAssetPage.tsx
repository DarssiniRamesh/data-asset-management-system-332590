import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { copyAsset, queryAssetCopyLineage } from "../api/endpoints";
import type { AssetCopyLineageDto } from "../api/types";
import { parseApiError } from "../api/errorHandling";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { Modal } from "../components/Modal";
import { FormInput } from "../components/FormInput";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { logger } from "../lib/logger";
import { can, roleLabel } from "../lib/rbac";
import { useAuth } from "../state/AuthContext";
import { useToasts } from "../state/ToastContext";

type CopyAssetFlowState = "editing" | "confirming" | "submitting" | "confirmed";

/**
 * Best-effort extraction of copy identifiers from the CopyAsset endpoint.
 * Backend contract is intentionally treated as weakly-typed here because CopyAssetResponse
 * isn't fully defined in the frontend types yet.
 */
function tryExtractCopyMetadata(resp: unknown): {
  copyOperationId?: string;
  targetAssetId?: string;
} {
  if (!resp || typeof resp !== "object") return {};
  const r = resp as Record<string, unknown>;

  const copyOperationId =
    (typeof r["copyOperationId"] === "string" ? (r["copyOperationId"] as string) : undefined) ??
    (typeof r["CopyOperationId"] === "string" ? (r["CopyOperationId"] as string) : undefined);

  const targetAssetId =
    (typeof r["targetAssetId"] === "string" ? (r["targetAssetId"] as string) : undefined) ??
    (typeof r["TargetAssetId"] === "string" ? (r["TargetAssetId"] as string) : undefined) ??
    (typeof r["newAssetId"] === "number" ? String(r["newAssetId"]) : undefined) ??
    (typeof r["NewAssetId"] === "number" ? String(r["NewAssetId"]) : undefined);

  return { copyOperationId, targetAssetId };
}

function statusPillClass(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s.includes("complete") || s.includes("success")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("fail") || s.includes("error")) return "bg-red-50 text-red-700 border-red-200";
  if (s.includes("progress") || s.includes("running")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (s.includes("pending") || s.includes("queued")) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

// PUBLIC_INTERFACE
export function CopyAssetPage() {
  /**
   * Copy Asset Flow (BRD “Confirmation!” UX)
   *
   * Flow name: CopyAssetFlow
   * Single entrypoint (UI): CopyAssetPage
   *
   * Contract:
   * Inputs:
   *  - assetId (route param, required)
   *  - newName (user-provided, required, trimmed)
   * Outputs:
   *  - Calls POST /api/assets/{assetId}/copy
   *  - On success, shows “Confirmation!” panel with next actions
   *  - Optionally attempts to query GET /api/asset-copy-lineage for lineage/replication visibility
   * Errors:
   *  - Validation errors shown inline/toast
   *  - API errors parsed via parseApiError; includes RBAC guidance when relevant
   * Side effects:
   *  - network calls to backend
   * Observability:
   *  - structured logs for start/success/failure
   */
  const { assetId } = useParams<{ assetId: string }>();
  const nav = useNavigate();
  const { pushToast } = useToasts();
  const { user } = useAuth();

  const [newName, setNewName] = useState("");
  const [flowState, setFlowState] = useState<CopyAssetFlowState>("editing");

  const [showLineage, setShowLineage] = useState(false);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [lineageError, setLineageError] = useState<string | null>(null);
  const [lineageRows, setLineageRows] = useState<AssetCopyLineageDto[]>([]);

  const [copyOperationId, setCopyOperationId] = useState<string | undefined>(undefined);
  const [targetAssetId, setTargetAssetId] = useState<string | undefined>(undefined);

  // Prevent overlapping lineage fetches on fast toggles / re-renders.
  const lineageAbortRef = useRef<AbortController | null>(null);

  const validation = useMemo(() => {
    if (!assetId) return "Missing assetId in route.";
    if (!newName.trim()) return "New asset name is required.";
    if (newName.trim().length < 2) return "New asset name must be at least 2 characters.";
    return "";
  }, [assetId, newName]);

  const canCopy = can(user?.role, "copy");

  async function submitCopy(): Promise<void> {
    if (!assetId) return;

    if (!canCopy) {
      pushToast({
        type: "error",
        title: "Not authorized",
        message: `Your role (${roleLabel(user?.role)}) cannot copy assets. Editor or Admin required.`,
      });
      return;
    }

    if (validation) {
      pushToast({ type: "error", title: validation });
      return;
    }

    logger.info("CopyAssetFlow:submit:start", {
      assetId,
      requestedName: newName.trim(),
      role: user?.role,
    });

    setFlowState("submitting");
    try {
      const resp = await copyAsset(assetId, { newAssetName: newName.trim() });
      const meta = tryExtractCopyMetadata(resp);

      setCopyOperationId(meta.copyOperationId);
      setTargetAssetId(meta.targetAssetId);

      setFlowState("confirmed");

      pushToast({
        type: "success",
        title: "Copy requested",
        message: "Your copy request was accepted. You can view lineage/status on this page.",
      });

      logger.info("CopyAssetFlow:submit:success", {
        assetId,
        copyOperationId: meta.copyOperationId,
        targetAssetId: meta.targetAssetId,
      });
    } catch (e) {
      const parsed = parseApiError(e);
      logger.error("CopyAssetFlow:submit:failed", {
        assetId,
        message: e instanceof Error ? e.message : String(e),
        status: parsed?.title,
      });

      setFlowState("editing");

      // Prefer backend-provided detail when available.
      if (parsed) {
        pushToast({
          type: "error",
          title: parsed.title,
          message: parsed.remediation ? `${parsed.message ?? ""} ${parsed.remediation}`.trim() : parsed.message,
        });
      } else {
        pushToast({
          type: "error",
          title: "Copy failed",
          message: `Check your role (${roleLabel(user?.role)}) and try again.`,
        });
      }
    }
  }

  function openConfirm(): void {
    if (!canCopy) {
      pushToast({
        type: "error",
        title: "Not authorized",
        message: `Your role (${roleLabel(user?.role)}) cannot copy assets. Editor or Admin required.`,
      });
      return;
    }
    if (validation) {
      pushToast({ type: "error", title: "Fix form errors", message: validation });
      return;
    }
    setFlowState("confirming");
  }

  function closeConfirm(): void {
    setFlowState("editing");
  }

  async function fetchLineage(): Promise<void> {
    // Explicitly cancel any prior in-flight request.
    lineageAbortRef.current?.abort();
    lineageAbortRef.current = new AbortController();

    if (!assetId) return;

    setLineageLoading(true);
    setLineageError(null);

    logger.debug("CopyAssetFlow:lineage:fetch:start", {
      assetId,
      copyOperationId,
      targetAssetId,
    });

    try {
      // Best-effort query: prefer copyOperationId if present; otherwise show by source asset.
      const rows = await queryAssetCopyLineage({
        copyOperationId,
        sourceAssetId: copyOperationId ? undefined : assetId,
        targetAssetId,
        limit: 25,
      });

      setLineageRows(rows);

      logger.debug("CopyAssetFlow:lineage:fetch:success", { count: rows.length });
    } catch (e) {
      // This endpoint may not be enabled in all backend builds; treat as optional but visible.
      const parsed = parseApiError(e);

      const msg =
        parsed?.message ||
        (e instanceof Error ? e.message : String(e)) ||
        "Unable to load copy lineage.";

      setLineageError(msg);

      logger.warn("CopyAssetFlow:lineage:fetch:failed", {
        assetId,
        copyOperationId,
        targetAssetId,
        message: msg,
      });
    } finally {
      setLineageLoading(false);
    }
  }

  // Keep fetchLineage stable so our effect dependencies can be explicit without eslint disables.
  const fetchLineageKey = useMemo(() => {
    return JSON.stringify({
      assetId,
      showLineage,
      copyOperationId: copyOperationId ?? null,
      targetAssetId: targetAssetId ?? null,
    });
  }, [assetId, showLineage, copyOperationId, targetAssetId]);

  useEffect(() => {
    if (!showLineage) return;
    void fetchLineage();

    return () => {
      lineageAbortRef.current?.abort();
    };
    // fetchLineage is safe here; it only closes over current state and abort controller ref.
    // The key ensures we re-fetch when identifiers change.
  }, [fetchLineageKey, showLineage]);

  if (!assetId) {
    return (
      <div className="space-y-4">
        <Breadcrumbs
          crumbs={[
            { label: "Dashboard", to: "/app" },
            { label: "Assets", to: "/app/assets" },
            { label: "Copy" },
          ]}
        />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          Missing asset id. Return to <Link className="underline" to="/app/assets">Assets</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: "Assets", to: "/app/assets" },
          { label: `Asset ${assetId}`, to: `/app/assets/${assetId}` },
          { label: "Copy" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Copy Asset</h1>
        <p className="muted mt-1">
          Source asset: <span className="font-mono">{assetId}</span>
        </p>
      </div>

      {/* Step 1: Details */}
      {flowState !== "confirmed" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Review before copying</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>The new asset will duplicate core configuration from the source.</li>
                <li>You can optionally check copy lineage/replication status after confirmation.</li>
              </ul>
            </div>

            <FormInput
              label="New Asset Name"
              value={newName}
              onChange={setNewName}
              error={validation && !validation.includes("Missing assetId") ? validation : undefined}
            />

            {!canCopy ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                You are signed in as <span className="font-semibold">{roleLabel(user?.role)}</span>. Copy requires{" "}
                <span className="font-semibold">Editor</span> or <span className="font-semibold">Admin</span>.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={openConfirm}
                disabled={flowState === "submitting"}
              >
                Continue
              </button>
              <button className="btn-ghost" onClick={() => nav(`/app/assets/${assetId}`)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 3: Confirmation! */}
      {flowState === "confirmed" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-emerald-800">Confirmation!</div>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-emerald-950">
                Copy request submitted
              </h2>
              <p className="mt-2 text-sm text-emerald-900/90">
                The backend accepted your copy request. Depending on environment, replication may complete asynchronously.
              </p>

              <div className="mt-4 grid gap-2 text-sm text-emerald-950">
                <div>
                  <span className="font-semibold">Source Asset ID:</span>{" "}
                  <span className="font-mono">{assetId}</span>
                </div>
                <div>
                  <span className="font-semibold">Requested Name:</span>{" "}
                  <span className="font-mono">{newName.trim()}</span>
                </div>
                {copyOperationId ? (
                  <div>
                    <span className="font-semibold">Copy Operation ID:</span>{" "}
                    <span className="font-mono">{copyOperationId}</span>
                  </div>
                ) : null}
                {targetAssetId ? (
                  <div>
                    <span className="font-semibold">Target Asset ID:</span>{" "}
                    <span className="font-mono">{targetAssetId}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button className="btn-primary" onClick={() => nav("/app/assets")}>
                Go to Assets
              </button>
              {targetAssetId ? (
                <button
                  className="btn-ghost"
                  onClick={() => nav(`/app/assets/${encodeURIComponent(targetAssetId)}`)}
                >
                  View Target Asset
                </button>
              ) : (
                <button className="btn-ghost" onClick={() => nav(`/app/assets/${assetId}`)}>
                  Back to Source Asset
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={showLineage}
                onChange={(e) => setShowLineage(e.target.checked)}
              />
              <span className="font-semibold text-slate-900">
                Show copy lineage / replication status (optional)
              </span>
            </label>

            {showLineage ? (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-600">
                    Data from <span className="font-mono">/api/asset-copy-lineage</span>
                  </div>
                  <button className="btn-ghost" onClick={() => void fetchLineage()} disabled={lineageLoading}>
                    Refresh
                  </button>
                </div>

                {lineageLoading ? (
                  <div className="mt-3">
                    <LoaderSpinner label="Loading lineage..." />
                  </div>
                ) : lineageError ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <div className="font-semibold">Lineage not available</div>
                    <div className="mt-1">{lineageError}</div>
                    <div className="mt-2 text-xs text-amber-900/80">
                      This endpoint may be disabled in some backend builds. The copy request itself succeeded.
                    </div>
                  </div>
                ) : lineageRows.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    No lineage records found yet. Try refreshing in a few seconds.
                  </div>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Source</th>
                          <th className="py-2 pr-4">Target</th>
                          <th className="py-2 pr-4">Operation</th>
                          <th className="py-2 pr-4">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineageRows.map((r, idx) => (
                          <tr key={`${r.assetCopyLineageId ?? "row"}-${idx}`} className="border-b border-slate-100">
                            <td className="py-2 pr-4">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusPillClass(
                                  r.status,
                                )}`}
                              >
                                {r.status ?? "Unknown"}
                              </span>
                            </td>
                            <td className="py-2 pr-4 font-mono">{r.sourceAssetId ?? "-"}</td>
                            <td className="py-2 pr-4 font-mono">{r.targetAssetId ?? "-"}</td>
                            <td className="py-2 pr-4 font-mono">{r.copyOperationId ?? "-"}</td>
                            <td className="py-2 pr-4 text-slate-700">{r.statusDetail ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Step 2: Confirmation modal */}
      <Modal
        open={flowState === "confirming" || flowState === "submitting"}
        title="Confirmation!"
        onClose={() => {
          if (flowState === "submitting") return;
          closeConfirm();
        }}
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button className="btn-ghost" onClick={closeConfirm} disabled={flowState === "submitting"}>
              Back
            </button>
            <button
              className="btn-primary"
              onClick={() => void submitCopy()}
              disabled={flowState === "submitting"}
            >
              {flowState === "submitting" ? <LoaderSpinner label="Submitting..." /> : "Confirm & Copy"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
          <p>
            You are about to create a copy of asset <span className="font-mono">{assetId}</span> with the new name:
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-slate-900 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-100">
            {newName.trim() || "(empty)"}
          </div>

          {!canCopy ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              Not authorized: your role is <span className="font-semibold">{roleLabel(user?.role)}</span>.
            </div>
          ) : null}

          <p className="text-xs text-slate-500">
            Tip: After confirmation, you can enable “Show copy lineage / replication status” to view records from{" "}
            <span className="font-mono">/api/asset-copy-lineage</span> when supported.
          </p>
        </div>
      </Modal>
    </div>
  );
}
