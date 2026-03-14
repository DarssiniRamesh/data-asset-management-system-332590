import { useEffect, useMemo, useState } from "react";
import { createAssetProperty, listAssetProperties, updateAssetProperty } from "../../../api/endpoints";
import type { AssetPropertyDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = AssetPropertyDto;

// PUBLIC_INTERFACE
export function AssetPropertiesTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Asset Properties tab CRUD
   * Backend:
   *  - GET /api/assets/{assetId}/properties
   *  - POST /api/assets/{assetId}/properties
   *  - PUT /api/assets/{assetId}/properties/{assetPropertyId}
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ propertyName: "", propertyValue: "", isActive: true });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const list = await listAssetProperties(asset.assetId);
    setRows(list);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const list = await listAssetProperties(asset.assetId);
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
    setForm({ propertyName: "", propertyValue: "", isActive: true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      propertyName: r.propertyName ?? "",
      propertyValue: r.propertyValue ?? "",
      isActive: r.isActive ?? true,
    });
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
      propertyName: form.propertyName,
      propertyValue: form.propertyValue,
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
        await createAssetProperty(asset.assetId, {
          propertyName: form.propertyName.trim(),
          propertyValue: form.propertyValue.trim(),
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Property created" });
      } else {
        await updateAssetProperty(asset.assetId, editing.assetPropertyId, {
          propertyName: form.propertyName.trim(),
          propertyValue: form.propertyValue.trim(),
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Property updated" });
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
      { key: "name", header: "Property", render: (r) => <span className="text-sm font-semibold">{r.propertyName ?? "-"}</span> },
      { key: "value", header: "Value", render: (r) => <span className="text-sm">{r.propertyValue ?? "-"}</span> },
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
        title="Asset Properties"
        description="BRD-required asset-scoped properties module."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No asset properties"
        emptyMessage="No properties were found for this asset."
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Asset Properties"
            description="Manage properties for this asset."
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Property"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.assetPropertyId} emptyLabel="No properties." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Property" : "Create Property"}
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
            label="Property Name"
            value={form.propertyName}
            onChange={(v) => setForm((s) => ({ ...s, propertyName: v }))}
            error={fieldErrors.propertyName}
          />
          <FormInput
            label="Property Value"
            value={form.propertyValue}
            onChange={(v) => setForm((s) => ({ ...s, propertyValue: v }))}
            error={fieldErrors.propertyValue}
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
