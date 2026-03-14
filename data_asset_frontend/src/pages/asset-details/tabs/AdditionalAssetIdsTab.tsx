import { roleLabel } from "../../../lib/rbac";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";

// PUBLIC_INTERFACE
export function AdditionalAssetIdsTab({ caps }: AssetDetailsTabProps) {
  /** Contract:
   * Output:
   *  - Placeholder panel for BRD-required tab.
   * Notes:
   *  - Wiring to /api/assets/{assetId}/additional-ids is a later step.
   */
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Additional Asset IDs</div>
          <div className="muted mt-1">BRD-required additional identifiers module.</div>
        </div>

        {!caps.canEdit ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
        Not yet wired in this step. Planned API: GET/POST/PUT{" "}
        <code className="font-mono">/api/assets/{`{assetId}`}/additional-ids</code>.
      </div>
    </div>
  );
}
