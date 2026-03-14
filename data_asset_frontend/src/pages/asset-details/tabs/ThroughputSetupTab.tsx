import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";

// PUBLIC_INTERFACE
export function ThroughputSetupTab({ caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - Throughput Setup is scoped to (assetId, inputParameterId).
   *  - inputParameterId MUST come from Associated Input Parameters tab selection (no manual entry).
   * RBAC:
   *  - Viewer: can view; cannot create/update.
   *  - Editor/Admin: can create/update.
   */
  const { selectedInputParameterId } = useInputParameterSelection();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Throughput Setup</div>
          <div className="muted mt-1">Configure throughput equations/scalars for the selected input parameter.</div>
        </div>

        {!caps.canEdit ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
          </div>
        ) : null}
      </div>

      {!selectedInputParameterId ? (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to configure
          Throughput Setup.
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
          Selected inputParameterId: <span className="font-mono font-semibold">{selectedInputParameterId}</span>
          <div className="muted mt-2 text-xs">
            Planned API:{" "}
            <code className="font-mono">
              /api/assets/{`{assetId}`}/input-parameters/{`{inputParameterId}`}/throughput-equations
            </code>{" "}
            (legacy throughput generate endpoint is already wrapped in endpoints.ts).
          </div>
        </div>
      )}
    </div>
  );
}
