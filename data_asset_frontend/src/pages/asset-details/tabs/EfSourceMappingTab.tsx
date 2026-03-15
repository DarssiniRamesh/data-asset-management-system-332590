import { useEffect, useMemo, useState } from "react";
import { createEfSourceMapping, listEfSourceMappings, updateEfSourceMapping } from "../../../api/endpoints";
import type { EfSourceMappingDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = EfSourceMappingDto;

// PUBLIC_INTERFACE
export function EfSourceMappingTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: EF Source Mapping CRUD
   * Scope: assetId + selected inputParameterId
   * Backend:
   *  - GET/POST /api/assets/{assetId}/input-parameters/{inputParameterId}/ef-source-mappings
   *  - PUT /api/assets/{assetId}/input-parameters/{inputParameterId}/ef-source-mappings/{efSourceMappingId}
   */
  const { selectedInputParameterId } = useInputParameterSelection();
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ efSourceId: "", isActive: true });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    if (!selectedInputParameterId) return;
    const list = await listEfSourceMappings(asset.assetId, selectedInputParameterId);
    setRows(list);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      if (!selectedInputParameterId) {
        setRows([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const list = await listEfSourceMappings(asset.assetId, selectedInputParameterId);
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
  }, [asset.assetId, selectedInputParameterId]);

  function openCreate(): void {
    setEditing(null);
    setForm({ efSourceId: "", isActive: true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({ efSourceId: r.efSourceId ?? "", isActive: r.isActive ?? true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function onSave(): Promise<void> {
    if (!selectedInputParameterId) return;

    if (!user?.username) {
      setBanner({ title: "Not signed in", message: "Please login again." });
      return;
    }

    setBanner(null);
    setFieldErrors({});

    const reqErrors = validateRequiredStrings({ efSourceId: form.efSourceId });
    if (Object.keys(reqErrors).length > 0) {
      setFieldErrors(reqErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      if (!editing) {
        await createEfSourceMapping(asset.assetId, selectedInputParameterId, {
          efSourceId: form.efSourceId.trim(),
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "EF source mapping created" });
      } else {
        await updateEfSourceMapping(asset.assetId, selectedInputParameterId, editing.efSourceMappingId, {
          efSourceId: form.efSourceId.trim(),
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "EF source mapping updated" });
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
      { key: "efSourceId", header: "EF Source ID", render: (r) => <span className="font-mono text-xs">{r.efSourceId ?? "-"}</span> },
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

  if (!selectedInputParameterId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">EF Source Mapping</div>
        <div className="muted mt-1">Configure EF source mapping for the selected input parameter.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to configure EF
          Source Mapping.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="EF Source Mapping"
        description="Configure EF source mapping for the selected input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No EF source mappings"
        emptyMessage="No EF source mappings were found for the selected input parameter."
        emptyActions={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs opacity-80">
              Next step: add an EF Source ID for InputParameterId <span className="font-mono font-semibold">{selectedInputParameterId}</span>.
            </div>
            {caps.canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Create EF Mapping
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary opacity-60"
                disabled
                title="Create requires Editor or Admin role"
              >
                Create EF Mapping
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <CrudActionBar
            title="EF Source Mapping"
            description={`InputParameterId: ${selectedInputParameterId}`}
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create EF Mapping"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.efSourceMappingId} emptyLabel="No EF source mappings." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit EF Source Mapping" : "Create EF Source Mapping"}
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
            label="EF Source ID"
            value={form.efSourceId}
            onChange={(v) => setForm((s) => ({ ...s, efSourceId: v }))}
            error={fieldErrors.efSourceId}
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
