import type { AssetDetailsTabProps } from "../AssetDetailsTab";

// PUBLIC_INTERFACE
export function AssetDetailsOverviewTab({ asset }: AssetDetailsTabProps) {
  /** Contract:
   * Inputs:
   *  - asset: loaded AssetDto for the route assetId
   * Output:
   *  - Read-only summary cards for the asset's key identifiers.
   * Side effects:
   *  - None (pure UI).
   */
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
        <div className="text-sm font-semibold">Configuration</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="muted">Asset ID</div>
            <div className="text-sm font-semibold">{asset.assetId}</div>
          </div>
          <div>
            <div className="muted">Global Unique Asset ID</div>
            <div className="text-sm font-semibold">{asset.globalUniqueAssetId}</div>
          </div>
          <div>
            <div className="muted">Permit EU ID</div>
            <div className="text-sm font-semibold">{asset.permitEuId}</div>
          </div>
          <div>
            <div className="muted">Site</div>
            <div className="text-sm font-semibold">{asset.siteId}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Modules</div>
        <div className="muted mt-2">
          Use the tabs to view and manage BRD-required linked setup modules (RBAC-aware).
        </div>
      </div>
    </div>
  );
}
