import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaEdit } from "react-icons/fa";
import { getAsset } from "../api/endpoints";
import type { AssetDto } from "../api/types";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { Icon } from "../components/Icon";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { Tabs, type TabSpec } from "../components/Tabs";
import { useToasts } from "../state/ToastContext";
import { useAuth } from "../state/AuthContext";
import { getUiCapabilities } from "../lib/rbac";

import { AssetDetailsOverviewTab } from "./asset-details/tabs/AssetDetailsOverviewTab";
import { AssetPropertiesTab } from "./asset-details/tabs/AssetPropertiesTab";
import { ControlDevicesTab } from "./asset-details/tabs/ControlDevicesTab";
import { InputParametersTab } from "./asset-details/tabs/InputParametersTab";
import { ParentInputParameterMappingTab } from "./asset-details/tabs/ParentInputParameterMappingTab";
import { ReportingAttributesMappingTab } from "./asset-details/tabs/ReportingAttributesMappingTab";
import { StatusLogTab } from "./asset-details/tabs/StatusLogTab";
import { AdditionalAssetIdsTab } from "./asset-details/tabs/AdditionalAssetIdsTab";
import { EfSourceMappingTab } from "./asset-details/tabs/EfSourceMappingTab";
import { ThroughputSetupTab } from "./asset-details/tabs/ThroughputSetupTab";
import { DataInputTab } from "./asset-details/tabs/DataInputTab";
import { InputParameterSelectionProvider } from "./asset-details/InputParameterSelectionContext";

type TabId =
  | "asset-details"
  | "asset-properties"
  | "control-devices"
  | "input-parameters"
  | "ef-source-mapping"
  | "throughput-setup"
  | "data-input"
  | "parent-input-mapping"
  | "reporting-attributes"
  | "status-log"
  | "additional-ids";

// PUBLIC_INTERFACE
export function AssetDetailsPage() {
  /** AssetDetailsPageFlow (BRD step 03.01)
   * Contract:
   * - Entry inputs:
   *    - route param assetId (string)
   * - Core behavior:
   *    - Loads the AssetDto via GET /api/assets/{assetId}
   *    - Renders BRD-required tab set and delegates each tab to its own component
   * - RBAC UX:
   *    - Viewer: read-only; Edit CTA disabled with explanation tooltip
   *    - Editor/Admin: Edit CTA enabled
   * - Errors:
   *    - Asset load failures show toast and "Asset not found" state
   * - Side effects:
   *    - Network call to backend via endpoints.ts
   */
  const { assetId } = useParams<{ assetId: string }>();
  const { pushToast } = useToasts();
  const { user } = useAuth();
  const caps = getUiCapabilities(user?.role);

  const [asset, setAsset] = useState<AssetDto | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  const [tab, setTab] = useState<TabId>("asset-details");

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
      } catch {
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
      { id: "asset-details", label: "Asset Details" },
      { id: "asset-properties", label: "Asset Properties" },
      { id: "control-devices", label: "Associated Control Devices" },

      // Primary selector per BRD step 04.01
      { id: "input-parameters", label: "Associated Input Parameters" },

      // Dependent modules (inputParameterId scoped)
      { id: "ef-source-mapping", label: "EF Source Mapping" },
      { id: "throughput-setup", label: "Throughput Setup" },
      { id: "data-input", label: "Data Input" },

      { id: "parent-input-mapping", label: "Parent Input Parameter Mapping" },
      { id: "reporting-attributes", label: "Reporting Attributes Mapping" },
      { id: "status-log", label: "Status Log" },
      { id: "additional-ids", label: "Additional Asset IDs" },
    ],
    [],
  );

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

          <InputParameterSelectionProvider>
            {tab === "asset-details" ? <AssetDetailsOverviewTab asset={asset} caps={caps} /> : null}
            {tab === "asset-properties" ? <AssetPropertiesTab asset={asset} caps={caps} /> : null}
            {tab === "control-devices" ? <ControlDevicesTab asset={asset} caps={caps} /> : null}

            {tab === "input-parameters" ? <InputParametersTab asset={asset} caps={caps} /> : null}
            {tab === "ef-source-mapping" ? <EfSourceMappingTab asset={asset} caps={caps} /> : null}
            {tab === "throughput-setup" ? <ThroughputSetupTab asset={asset} caps={caps} /> : null}
            {tab === "data-input" ? <DataInputTab asset={asset} caps={caps} /> : null}

            {tab === "parent-input-mapping" ? <ParentInputParameterMappingTab asset={asset} caps={caps} /> : null}
            {tab === "reporting-attributes" ? <ReportingAttributesMappingTab asset={asset} caps={caps} /> : null}
            {tab === "status-log" ? <StatusLogTab asset={asset} caps={caps} /> : null}
            {tab === "additional-ids" ? <AdditionalAssetIdsTab asset={asset} caps={caps} /> : null}
          </InputParameterSelectionProvider>
        </>
      ) : (
        <div className="text-sm text-slate-600 dark:text-slate-300">Asset not found.</div>
      )}
    </div>
  );
}
