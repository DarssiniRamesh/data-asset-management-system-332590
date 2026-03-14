import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { getAsset, listInputEfSourceMappings } from "../api/endpoints";
import type { AssetDto, InputEfMappingRow } from "../api/types";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { DataTable, type Column } from "../components/DataTable";
import { Icon } from "../components/Icon";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { Tabs, type TabSpec } from "../components/Tabs";
import { useToasts } from "../state/ToastContext";
import { useAuth } from "../state/AuthContext";
import { getUiCapabilities } from "../lib/rbac";

type TabId = "details" | "siteassets" | "inputef" | "throughput";

// PUBLIC_INTERFACE
export function AssetDetailsPage() {
  /** Contract:
   * - Loads asset via GET /api/assets/{assetId}
   * - Tabs load data from backend modules (where endpoints exist)
   * - RBAC UX:
   *    - Viewer: read-only; hide Edit CTA
   *    - Editor/Admin: can edit asset
   */
  const { assetId } = useParams<{ assetId: string }>();
  const { pushToast } = useToasts();
  const { user } = useAuth();
  const caps = getUiCapabilities(user?.role);

  const [asset, setAsset] = useState<AssetDto | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  const [tab, setTab] = useState<TabId>("details");

  // For module tabs (backend needs IDs; we use a user-entered inputParameterId)
  const [inputParameterId, setInputParameterId] = useState("1");
  const [mappingRows, setMappingRows] = useState<InputEfMappingRow[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      // Defensive: avoid calling GET /api/assets/undefined and avoid leaving the UI in a perpetual loading state.
      if (!assetId || assetId === "undefined" || assetId === "null") {
        if (mounted) {
          setAsset(null);
          setLoadingAsset(false);
        }
        return;
      }

      setLoadingAsset(true);
      try {
        const a = await getAsset(assetId);
        if (mounted) setAsset(a);
      } catch (e) {
        pushToast({ type: "error", title: "Failed to load asset" });
      } finally {
        if (mounted) setLoadingAsset(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [assetId, pushToast]);

  const tabs: TabSpec[] = useMemo(
    () => [
      { id: "details", label: "Asset Details" },
      { id: "siteassets", label: "Site Assets" },
      { id: "inputef", label: "Input EF Mapping" },
      { id: "throughput", label: "Throughput Setup" },
    ],
    [],
  );

  async function loadMappings(): Promise<void> {
    if (!assetId) return;
    setLoadingMappings(true);
    try {
      const data = await listInputEfSourceMappings(assetId, inputParameterId);
      setMappingRows(Array.isArray(data) ? data : []);
      pushToast({ type: "success", title: "Loaded mappings", message: `${(data || []).length} rows` });
    } catch (e) {
      pushToast({
        type: "error",
        title: "Failed to load EF mappings",
        message: "Verify inputParameterId and backend data availability.",
      });
    } finally {
      setLoadingMappings(false);
    }
  }

  const mappingColumns: Column<InputEfMappingRow>[] = [
    { key: "raw", header: "Row", render: (r) => <pre className="text-xs">{JSON.stringify(r, null, 2)}</pre> },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: "Assets", to: "/app/assets" },
          { label: asset?.assetName || "Details" },
        ]}
      />

      {loadingAsset ? (
        <LoaderSpinner label="Loading asset..." />
      ) : asset ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{asset.assetName}</h1>
              <p className="muted mt-1">
                {asset.siteId} • {asset.assetGroup} • {asset.processGroup}
              </p>
            </div>

            {caps.canEdit ? (
              <Link to={`/app/assets/${asset.assetId}/edit`} className="btn-primary" title="Edit asset">
                <Icon icon={FaEdit} className="h-4 w-4" /> Edit
              </Link>
            ) : (
              <button className="btn-primary opacity-60" disabled title="Edit requires Editor or Admin role">
                <Icon icon={FaEdit} className="h-4 w-4" /> Edit
              </button>
            )}
          </div>

          <Tabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

          {tab === "details" ? (
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
                  Use the tabs to view and manage module data (Site Assets, Input EF Mapping, Throughput Setup).
                </div>
              </div>
            </div>
          ) : null}

          {tab === "siteassets" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">Site Assets</div>
              <div className="muted mt-1">
                Backend provides legacy endpoints for managing site assets. This UI provides a placeholder panel and can be
                expanded to add/edit/delete rows.
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                Coming next: CRUD grid wired to /api/siteassets/managesiteassets and /api/siteassets/removesiteasset.
              </div>
            </div>
          ) : null}

          {tab === "inputef" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Input EF Mapping</div>
                    <div className="muted mt-1">Loads mappings via legacy endpoint using assetId + inputParameterId.</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="block">
                      <div className="label">Input Parameter ID</div>
                      <input
                        className="input mt-1 w-40"
                        value={inputParameterId}
                        onChange={(e) => setInputParameterId(e.target.value)}
                      />
                    </label>
                    <button className="btn-primary mt-6" onClick={loadMappings} disabled={loadingMappings}>
                      {loadingMappings ? "Loading..." : "Load"}
                    </button>
                  </div>
                </div>
              </div>

              {loadingMappings ? (
                <LoaderSpinner label="Loading mappings..." />
              ) : (
                <DataTable
                  columns={mappingColumns}
                  rows={mappingRows}
                  rowKey={(_, idx?: number) => String(idx ?? Math.random())}
                  emptyLabel="No mapping rows returned."
                />
              )}
            </div>
          ) : null}

          {tab === "throughput" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">Throughput Setup</div>
              <div className="muted mt-1">
                Endpoint available: /api/calculatedthroughputequationsetup/{`{assetId}`}/{`{inputParameterId}`}/generatethroughputforinputparameter
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                Coming next: CRUD workflow for throughput equations/scalars and generator actions with full validation.
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-sm text-slate-600 dark:text-slate-300">Asset not found.</div>
      )}
    </div>
  );
}
