import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAsset } from "../api/endpoints";
import type { CreateAssetRequest } from "../api/types";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { FormInput } from "../components/FormInput";
import { Tabs } from "../components/Tabs";
import { useToasts } from "../state/ToastContext";
import { LoaderSpinner } from "../components/LoaderSpinner";

type TabId = "core" | "ids" | "metadata";

// PUBLIC_INTERFACE
export function CreateAssetPage() {
  /** Contract:
   * - POST /api/assets
   * - Basic client validation; relies on backend validation for final constraints
   */
  const nav = useNavigate();
  const { pushToast } = useToasts();

  const [tab, setTab] = useState<TabId>("core");
  const [submitting, setSubmitting] = useState(false);

  const [siteId, setSiteId] = useState("S1");
  const [assetGroup, setAssetGroup] = useState("AG");
  const [processGroup, setProcessGroup] = useState("PG");
  const [assetName, setAssetName] = useState("");
  const [permitEuId, setPermitEuId] = useState("P1");
  const [globalUniqueAssetId, setGlobalUniqueAssetId] = useState("");

  const [createdBy, setCreatedBy] = useState("frontend");
  const [correlationId, setCorrelationId] = useState(`corr-${Date.now()}`);

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!assetName.trim()) errors.assetName = "Asset name is required";
    if (!siteId.trim()) errors.siteId = "Site is required";
    if (!globalUniqueAssetId.trim()) errors.globalUniqueAssetId = "Global unique asset id is required";
    return errors;
  }, [assetName, siteId, globalUniqueAssetId]);

  async function onSubmit(): Promise<void> {
    if (Object.keys(validation).length > 0) {
      pushToast({ type: "error", title: "Fix validation errors" });
      return;
    }
    setSubmitting(true);
    try {
      const req: CreateAssetRequest = {
        siteId,
        assetGroup,
        processGroup,
        assetName: assetName.trim(),
        permitEuId,
        globalUniqueAssetId: globalUniqueAssetId.trim(),
        createdBy,
        correlationId,
      };
      const created = await createAsset(req);
      pushToast({ type: "success", title: "Asset created", message: created.assetName });
      nav(`/app/assets/${created.assetId}`);
    } catch (e) {
      pushToast({ type: "error", title: "Create failed", message: "Check your role (Editor required)." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: "Assets", to: "/app/assets" },
          { label: "Create" },
        ]}
      />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Create Asset</h1>
          <p className="muted mt-1">Multi-section form with tabs.</p>
        </div>

        <button className="btn-primary" onClick={onSubmit} disabled={submitting}>
          {submitting ? <LoaderSpinner label="Creating..." /> : "Create"}
        </button>
      </div>

      <Tabs
        tabs={[
          { id: "core", label: "Core" },
          { id: "ids", label: "Identifiers" },
          { id: "metadata", label: "Metadata" },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        {tab === "core" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Site ID" value={siteId} onChange={setSiteId} error={validation.siteId} />
            <FormInput label="Asset Group" value={assetGroup} onChange={setAssetGroup} />
            <FormInput label="Process Group" value={processGroup} onChange={setProcessGroup} />
            <FormInput
              label="Asset Name"
              value={assetName}
              onChange={setAssetName}
              placeholder="e.g. Boiler Feed Pump"
              error={validation.assetName}
            />
          </div>
        ) : null}

        {tab === "ids" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Permit EU ID" value={permitEuId} onChange={setPermitEuId} />
            <FormInput
              label="Global Unique Asset ID"
              value={globalUniqueAssetId}
              onChange={setGlobalUniqueAssetId}
              placeholder="e.g. GUA-123"
              error={validation.globalUniqueAssetId}
            />
          </div>
        ) : null}

        {tab === "metadata" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Created By" value={createdBy} onChange={setCreatedBy} />
            <FormInput label="Correlation ID" value={correlationId} onChange={setCorrelationId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
