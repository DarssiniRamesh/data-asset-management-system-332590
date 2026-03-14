import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAsset, updateAsset } from "../api/endpoints";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { FormInput } from "../components/FormInput";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { useToasts } from "../state/ToastContext";
import { ApiError } from "../api/client";
import { useAuth } from "../state/AuthContext";
import { parseApiError } from "../api/errorHandling";

// PUBLIC_INTERFACE
export function EditAssetPage() {
  /** Contract:
   * - GET /api/assets/{assetId}
   * - PUT /api/assets/{assetId} (Editor/Admin required)
   * - Client validation:
   *    - assetName required
   *    - when requiresParentPseudo=true => parentPseudoAssetId must be provided
   * - Error surfacing:
   *    - 400 HttpValidationProblemDetails surfaced as field-level errors + message
   *    - 409 conflicts surfaced with duplicate-ID remediation guidance
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
  const [parentPseudoAssetId, setParentPseudoAssetId] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        setParentPseudoAssetId(a.parentPseudoAssetId ? String(a.parentPseudoAssetId) : "");
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

    if (requiresParentPseudo && !parentPseudoAssetId.trim()) {
      errors.parentPseudoAssetId = "Parent pseudo asset id is required when requiresParentPseudo is 'Yes'";
    }

    return errors;
  }, [assetName, requiresParentPseudo, parentPseudoAssetId]);

  async function onSave(): Promise<void> {
    if (!assetId) return;

    if (!canWrite) {
      pushToast({ type: "error", title: "Insufficient permissions", message: "Editor or Admin role is required." });
      return;
    }

    // Clear prior server-side errors when re-submitting.
    setFieldErrors({});

    if (Object.keys(validation).length > 0) {
      pushToast({ type: "error", title: "Fix validation errors", message: "Please correct the highlighted fields." });
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
        permitEuId: permitEuId.trim(),

        requiresParentPseudo,
        parentPseudoAssetId: requiresParentPseudo
          ? Number.isFinite(Number.parseInt(parentPseudoAssetId.trim(), 10))
            ? Number.parseInt(parentPseudoAssetId.trim(), 10)
            : null
          : null,

        modifiedBy: user?.username || "frontend",
        correlationId: `corr-${Date.now()}`,
      });

      pushToast({ type: "success", title: "Asset updated", message: updated.assetName });
      nav(`/app/assets/${assetId}`);
    } catch (e) {
      const parsed = parseApiError(e);
      if (parsed) {
        if (parsed.fieldErrors) setFieldErrors(parsed.fieldErrors);

        const msgParts = [parsed.message, parsed.remediation].filter(Boolean);
        pushToast({
          type: "error",
          title: parsed.title,
          message: msgParts.join(" "),
        });
        return;
      }

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
            <FormInput
              label="Asset Name"
              value={assetName}
              onChange={setAssetName}
              error={validation.assetName || fieldErrors.assetName}
            />
            <FormInput label="Site ID" value={siteId} onChange={setSiteId} error={fieldErrors.siteId} />
            <FormInput label="Asset Group" value={assetGroup} onChange={setAssetGroup} error={fieldErrors.assetGroup} />
            <FormInput
              label="Process Group"
              value={processGroup}
              onChange={setProcessGroup}
              error={fieldErrors.processGroup}
            />
            <FormInput
              label="Permit EU ID"
              value={permitEuId}
              onChange={setPermitEuId}
              error={fieldErrors.permitEuId}
            />
            <FormInput
              label="Global Unique Asset ID"
              value={globalUniqueAssetId}
              onChange={setGlobalUniqueAssetId}
              error={fieldErrors.globalUniqueAssetId}
            />

            <label className="block md:col-span-2">
              <div className="label">Requires Parent Pseudo Asset?</div>
              <select
                className="input mt-1"
                value={requiresParentPseudo ? "yes" : "no"}
                onChange={(e) => setRequiresParentPseudo(e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes (parentPseudoAssetId becomes required)</option>
              </select>
            </label>

            {requiresParentPseudo ? (
              <FormInput
                label="Parent Pseudo Asset ID"
                value={parentPseudoAssetId}
                onChange={setParentPseudoAssetId}
                placeholder="e.g. 123"
                error={validation.parentPseudoAssetId || fieldErrors.parentPseudoAssetId}
              />
            ) : null}

            <div className="muted md:col-span-2 text-xs">
              If you get a duplicate/conflict error, change <span className="font-semibold">Permit EU ID</span> and/or{" "}
              <span className="font-semibold">Global Unique Asset ID</span> to a unique value.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
