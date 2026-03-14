import { useEffect, useMemo, useState } from "react";
import { createAdditionalAssetId, listAdditionalAssetIds, updateAdditionalAssetId } from "../../../api/endpoints";
import type { AdditionalAssetIdDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = AdditionalAssetIdDto;

// PUBLIC_INTERFACE
export function AdditionalAssetIdsTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Additional Asset IDs CRUD
   * Backend:
   *  - GET /api/assets/{assetId}/additional-ids
   *  - POST /api/assets/{assetId}/additional-ids
   *  - PUT /api/assets/{assetId}/additional-ids/{additionalAssetId}
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ idType: "", idValue: "", isActive: true });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const list = await listAdditionalAssetIds(asset.assetId);
    setRows(list);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const list = await listAdditionalAssetIds(asset.assetId);
        if (!mounted) return;
        setRows(list);
      } catch (e) {
        if (!mounted) return;
        setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [asset.assetId]);

  function openCreate(): void {
    setEditing(null);
    setForm({ idType: "", idValue: "", isActive: true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({ idType: r.idType ?? "", idValue: r.idValue ?? "", isActive: r.isActive ?? true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function onSave(): Promise<void> {
    if (!user?.username) {
      setBanner({ title: "Not signed in", message: "Please login again." });
      return;
    }

    setBanner(null);
    setFieldErrors({});

    const reqErrors = validateRequiredStrings({
      idType: form.idType,
      idValue: form.idValue,
    });

    if (Object.keys(reqErrors).length > 0) {
      setFieldErrors(reqErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      if (!editing) {
        await createAdditionalAssetId(asset.assetId, {
          idType: form.idType.trim(),
          idValue: form.idValue.trim(),
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Additional ID created" });
      } else {
        await updateAdditionalAssetId(asset.assetId, editing.additionalAssetId, {
          idType: form.idType.trim(),
          idValue: form.idValue.trim(),
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Additional ID updated" });
      }

      await reload();
      setModalOpen(false);
    } catch (e) {
      const ex = extractErrors(e);
      setBanner({ title: ex.title, message: ex.message });
      setFieldErrors(ex.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "type", header: "Type", render: (r) => <span className="text-sm">{r.idType ?? "-"}</span> },
      { key: "value", header: "Value", render: (r) => <span className="font-mono text-xs">{r.idValue ?? "-"}</span> },
      { key: "active", header: "Active", render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span> },
      {
        key: "actions",
        header: "",
        widthClassName: "w-28",
        render: (r) =>
          caps.canEdit ? (
            <button type="button" className="btn-ghost" onClick={() => openEdit(r)}>
              Edit
            </button>
          ) : (
            <button type="button" className="btn-ghost opacity-60" disabled title="Edit requires Editor or Admin role">
              Edit
            </button>
          ),
      },
    ],
    [caps.canEdit],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Additional Asset IDs"
        description="BRD-required additional identifiers module."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No additional IDs"
        emptyMessage="No additional IDs were found for this asset."
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Additional Asset IDs"
            description="Manage additional identifiers for this asset."
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Additional ID"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.additionalAssetId} emptyLabel="No additional IDs." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Additional ID" : "Create Additional ID"}
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <button className="btn-ghost" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        {banner ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
            <div className="font-semibold">{banner.title}</div>
            {banner.message ? <div className="mt-1">{banner.message}</div> : null}
          </div>
        ) : null}

        <div className="space-y-3">
          <FormInput
            label="ID Type"
            value={form.idType}
            onChange={(v) => setForm((s) => ({ ...s, idType: v }))}
            error={fieldErrors.idType}
          />
          <FormInput
            label="ID Value"
            value={form.idValue}
            onChange={(v) => setForm((s) => ({ ...s, idValue: v }))}
            error={fieldErrors.idValue}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
