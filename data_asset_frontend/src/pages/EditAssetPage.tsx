import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAsset, updateAsset } from "../api/endpoints";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { FormInput } from "../components/FormInput";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { useToasts } from "../state/ToastContext";
import { ApiError } from "../api/client";
import { useAuth } from "../state/AuthContext";

// PUBLIC_INTERFACE
export function EditAssetPage() {
  /** Contract:
   * - GET /api/assets/{assetId}
   * - PUT /api/assets/{assetId} (Editor/Admin required)
   */
  const { assetId } = useParams<{ assetId: string }>();
  const nav = useNavigate();
  const { pushToast } = useToasts();
  const { user } = useAuth();

  const canWrite = user?.role === "Editor" || user?.role === "Admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assetName, setAssetName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [assetGroup, setAssetGroup] = useState("");
  const [processGroup, setProcessGroup] = useState("");
  const [permitEuId, setPermitEuId] = useState("");
  const [globalUniqueAssetId, setGlobalUniqueAssetId] = useState("");

  const [requiresParentPseudo, setRequiresParentPseudo] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      if (!assetId) return;
      setLoading(true);
      try {
        const a = await getAsset(assetId);
        if (!mounted) return;
        setAssetName(a.assetName || "");
        setSiteId(a.siteId || "");
        setAssetGroup(a.assetGroup || "");
        setProcessGroup(a.processGroup || "");
        setPermitEuId(a.permitEuId || "");
        setGlobalUniqueAssetId(a.globalUniqueAssetId || "");
        setRequiresParentPseudo(Boolean(a.requiresParentPseudo));
      } catch (e) {
        pushToast({ type: "error", title: "Failed to load asset" });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [assetId, pushToast]);

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!assetName.trim()) errors.assetName = "Asset name is required";
    return errors;
  }, [assetName]);

  async function onSave(): Promise<void> {
    if (!assetId) return;

    if (!canWrite) {
      pushToast({ type: "error", title: "Insufficient permissions", message: "Editor or Admin role is required." });
      return;
    }

    if (Object.keys(validation).length > 0) {
      pushToast({ type: "error", title: "Fix validation errors" });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAsset({
        assetId,
        assetName: assetName.trim(),
        siteId,
        assetGroup,
        processGroup,
        permitEuId,

        requiresParentPseudo,

        modifiedBy: user?.username || "frontend",
        correlationId: `corr-${Date.now()}`,
      });

      pushToast({ type: "success", title: "Asset updated", message: updated.assetName });
      nav(`/app/assets/${assetId}`);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.details.bodyText || `HTTP ${e.details.status}`
          : e instanceof Error
            ? e.message
            : String(e);

      pushToast({ type: "error", title: "Update failed", message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        crumbs={[
          { label: "Dashboard", to: "/app" },
          { label: "Assets", to: "/app/assets" },
          { label: "Edit" },
        ]}
      />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Edit Asset</h1>
          <p className="muted mt-1">{assetId}</p>
        </div>

        <button className="btn-primary" onClick={onSave} disabled={saving || loading}>
          {saving ? <LoaderSpinner label="Saving..." /> : "Save changes"}
        </button>
      </div>

      {loading ? (
        <LoaderSpinner label="Loading asset..." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput label="Asset Name" value={assetName} onChange={setAssetName} error={validation.assetName} />
            <FormInput label="Site ID" value={siteId} onChange={setSiteId} />
            <FormInput label="Asset Group" value={assetGroup} onChange={setAssetGroup} />
            <FormInput label="Process Group" value={processGroup} onChange={setProcessGroup} />
            <FormInput label="Permit EU ID" value={permitEuId} onChange={setPermitEuId} />
            <FormInput label="Global Unique Asset ID" value={globalUniqueAssetId} onChange={setGlobalUniqueAssetId} />

            <label className="block md:col-span-2">
              <div className="label">Requires Parent Pseudo Asset?</div>
              <select
                className="input mt-1"
                value={requiresParentPseudo ? "yes" : "no"}
                onChange={(e) => setRequiresParentPseudo(e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
