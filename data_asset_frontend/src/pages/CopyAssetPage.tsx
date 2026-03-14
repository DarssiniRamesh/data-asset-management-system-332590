import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { copyAsset } from "../api/endpoints";
import { Breadcrumbs } from "../layout/Breadcrumbs";
import { FormInput } from "../components/FormInput";
import { LoaderSpinner } from "../components/LoaderSpinner";
import { useToasts } from "../state/ToastContext";

// PUBLIC_INTERFACE
export function CopyAssetPage() {
  /** Contract:
   * - POST /api/assets/{assetId}/copy
   */
  const { assetId } = useParams<{ assetId: string }>();
  const nav = useNavigate();
  const { pushToast } = useToasts();

  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validation = useMemo(() => {
    if (!newName.trim()) return "New asset name is required.";
    return "";
  }, [newName]);

  async function onSubmit(): Promise<void> {
    if (!assetId) return;
    if (validation) {
      pushToast({ type: "error", title: validation });
      return;
    }
    setSubmitting(true);
    try {
      await copyAsset(assetId, { newAssetName: newName.trim() });
      pushToast({ type: "success", title: "Copy requested", message: "Refresh assets list to find the duplicate." });
      nav("/app/assets");
    } catch (e) {
      pushToast({ type: "error", title: "Copy failed", message: "Check your role (Editor required)." });
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
          { label: "Copy" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Copy Asset</h1>
        <p className="muted mt-1">Source: {assetId}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-4">
          <FormInput label="New Asset Name" value={newName} onChange={setNewName} error={validation || undefined} />
          <button className="btn-primary w-fit" onClick={onSubmit} disabled={submitting}>
            {submitting ? <LoaderSpinner label="Copying..." /> : "Create Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
