import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAsset } from "../api/endpoints";
import type { CreateAssetRequest } from "../api/types";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { FormInput } from "../components/FormInput";
import { Tabs } from "../components/Tabs";
import { useToasts } from "../state/ToastContext";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { ApiError } from "../api/client";
import { useAuth } from "../state/AuthContext";
import { parseApiError } from "../api/errorHandling";

type TabId = "core" | "ids" | "metadata";

// PUBLIC_INTERFACE
export function CreateAssetPage() {
  /** Contract:
   * - POST /api/assets (Editor/Admin required)
   * - Client validation:
   *    - required fields
   *    - when requiresParentPseudo=true => parentPseudoAssetId must be provided
   * - Error surfacing:
   *    - 400 HttpValidationProblemDetails surfaced as field-level errors + message
   *    - 409 ProblemDetails surfaced with actionable duplicate-ID remediation
   */
  const nav = useNavigate();
  const { pushToast } = useToasts();
  const { user } = useAuth();

  const canWrite = user?.role === "Editor" || user?.role === "Admin";

  const [tab, setTab] = useState<TabId>("core");
  const [submitting, setSubmitting] = useState(false);

  const [siteId, setSiteId] = useState("S1");
  const [assetGroup, setAssetGroup] = useState("AG");
  const [processGroup, setProcessGroup] = useState("PG");
  const [assetName, setAssetName] = useState("");
  const [permitEuId, setPermitEuId] = useState("P1");
  const [globalUniqueAssetId, setGlobalUniqueAssetId] = useState("");

  // Backend-required flag for deterministic validation
  const [requiresParentPseudo, setRequiresParentPseudo] = useState(false);
  const [parentPseudoAssetId, setParentPseudoAssetId] = useState("");

  const [createdBy, setCreatedBy] = useState(() => user?.username || "frontend");
  const [correlationId, setCorrelationId] = useState(`corr-${Date.now()}`);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!assetName.trim()) errors.assetName = "Asset name is required";
    if (!siteId.trim()) errors.siteId = "Site is required";
    if (!globalUniqueAssetId.trim()) errors.globalUniqueAssetId = "Global unique asset id is required";
    if (!correlationId.trim()) errors.correlationId = "Correlation id is required";
    if (!createdBy.trim()) errors.createdBy = "Created by is required";

    // Critical invariant: if the boolean says a parent is required, require the ID on the client too.
    if (requiresParentPseudo && !parentPseudoAssetId.trim()) {
      errors.parentPseudoAssetId = "Parent pseudo asset id is required when requiresParentPseudo is 'Yes'";
    }

    return errors;
  }, [assetName, siteId, globalUniqueAssetId, correlationId, createdBy, requiresParentPseudo, parentPseudoAssetId]);

  async function onSubmit(): Promise<void> {
    if (!canWrite) {
      pushToast({ type: "error", title: "Insufficient permissions", message: "Editor or Admin role is required." });
      return;
    }

    // Clear prior server-side errors when re-submitting.
    setFieldErrors({});

    if (Object.keys(validation).length > 0) {
      // Move user to the most likely tab for fixing.
      if (validation.permitEuId || validation.globalUniqueAssetId) setTab("ids");
      else if (validation.parentPseudoAssetId || validation.createdBy || validation.correlationId) setTab("metadata");
      else setTab("core");

      pushToast({ type: "error", title: "Fix validation errors", message: "Please correct the highlighted fields." });
      return;
    }

    setSubmitting(true);
    try {
      const parsedParentPseudoId = requiresParentPseudo
        ? Number.parseInt(parentPseudoAssetId.trim(), 10)
        : null;

      const req: CreateAssetRequest = {
        siteId,
        assetGroup,
        processGroup,
        assetName: assetName.trim(),
        permitEuId: permitEuId.trim(),
        globalUniqueAssetId: globalUniqueAssetId.trim(),

        requiresParentPseudo,
        // Must be a JSON number (or null) to match backend `long? ParentPseudoAssetId`.
        // If parsing fails, send null; client-side validation already requires the field to be present.
        parentPseudoAssetId:
          requiresParentPseudo && Number.isFinite(parsedParentPseudoId) ? parsedParentPseudoId : null,

        createdBy: createdBy.trim(),
        correlationId: correlationId.trim(),
      };

      const created = await createAsset(req);

      pushToast({ type: "success", title: "Asset created", message: `${created.assetName} (#${created.assetId})` });
      nav(`/app/assets/${created.assetId}`);
    } catch (e) {
      const parsed = parseApiError(e);

      // Prefer structured 400/409 rendering.
      if (parsed) {
        if (parsed.fieldErrors) {
          setFieldErrors(parsed.fieldErrors);

          // Best-effort UX: navigate user to the relevant tab for the failing field.
          if (parsed.fieldErrors.permitEuId || parsed.fieldErrors.globalUniqueAssetId) setTab("ids");
          else if (parsed.fieldErrors.parentPseudoAssetId) setTab("metadata");
        }

        const msgParts = [parsed.message, parsed.remediation].filter(Boolean);
        pushToast({
          type: "error",
          title: parsed.title,
          message: msgParts.join(" "),
        });

        // For 409 duplicates, guide user to the ID tab to change identifiers.
        if (e instanceof ApiError && e.details.status === 409) setTab("ids");
        return;
      }

      const msg =
        e instanceof ApiError
          ? e.details.bodyText || `HTTP ${e.details.status}`
          : e instanceof Error
            ? e.message
            : String(e);

      pushToast({ type: "error", title: "Create failed", message: msg });
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
            <FormInput
              label="Site ID"
              value={siteId}
              onChange={setSiteId}
              error={validation.siteId || fieldErrors.siteId}
            />
            <FormInput label="Asset Group" value={assetGroup} onChange={setAssetGroup} error={fieldErrors.assetGroup} />
            <FormInput
              label="Process Group"
              value={processGroup}
              onChange={setProcessGroup}
              error={fieldErrors.processGroup}
            />
            <FormInput
              label="Asset Name"
              value={assetName}
              onChange={setAssetName}
              placeholder="e.g. Boiler Feed Pump"
              error={validation.assetName || fieldErrors.assetName}
            />
          </div>
        ) : null}

        {tab === "ids" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              placeholder="e.g. GUA-123"
              error={validation.globalUniqueAssetId || fieldErrors.globalUniqueAssetId}
            />
            <div className="muted md:col-span-2 text-xs">
              If you see a duplicate/conflict error, change <span className="font-semibold">Permit EU ID</span> and/or{" "}
              <span className="font-semibold">Global Unique Asset ID</span> to a unique value.
            </div>
          </div>
        ) : null}

        {tab === "metadata" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Created By"
              value={createdBy}
              onChange={setCreatedBy}
              error={validation.createdBy || fieldErrors.createdBy}
            />
            <FormInput
              label="Correlation ID"
              value={correlationId}
              onChange={setCorrelationId}
              error={validation.correlationId || fieldErrors.correlationId}
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
              <div className="muted mt-1 text-xs">Backend requires this flag for deterministic validation.</div>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
