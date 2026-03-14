import { useEffect, useMemo, useState } from "react";
import { createDataInputValue, listDataInputValues, updateDataInputValue } from "../../../api/endpoints";
import type { DataInputValueDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors } from "../crud/crudFormUtils";

type Row = DataInputValueDto;

// PUBLIC_INTERFACE
export function DataInputTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Data Input CRUD
   * Scope: assetId + selected inputParameterId
   * Backend:
   *  - GET/POST /api/assets/{assetId}/input-parameters/{inputParameterId}/data-input-values
   *  - PUT /api/assets/{assetId}/input-parameters/{inputParameterId}/data-input-values/{dataInputValueId}
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

  const [form, setForm] = useState({ valueText: "", valueNumber: "", valueDateTime: "", isActive: true });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    if (!selectedInputParameterId) return;
    const list = await listDataInputValues(asset.assetId, selectedInputParameterId);
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
        const list = await listDataInputValues(asset.assetId, selectedInputParameterId);
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
    setForm({ valueText: "", valueNumber: "", valueDateTime: "", isActive: true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      valueText: r.valueText ?? "",
      valueNumber: r.valueNumber !== null && r.valueNumber !== undefined ? String(r.valueNumber) : "",
      valueDateTime: r.valueDateTime ?? "",
      isActive: r.isActive ?? true,
    });
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

    // At least one of the value fields should be provided (BRD is frequency-dependent; backend validates further).
    if (!form.valueText.trim() && !form.valueNumber.trim() && !form.valueDateTime.trim()) {
      setBanner({ title: "Validation failed", message: "Provide at least one value (Text, Number, or Date/Time)." });
      setFieldErrors({ valueText: "Provide at least one value" });
      return;
    }

    const num =
      form.valueNumber.trim() === ""
        ? null
        : Number.isFinite(Number(form.valueNumber))
          ? Number(form.valueNumber)
          : NaN;

    if (num !== null && Number.isNaN(num)) {
      setBanner({ title: "Validation failed", message: "Number value must be a valid number." });
      setFieldErrors({ valueNumber: "Must be a number" });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();

      if (!editing) {
        await createDataInputValue(asset.assetId, selectedInputParameterId, {
          valueText: form.valueText.trim() ? form.valueText.trim() : null,
          valueNumber: num,
          valueDateTime: form.valueDateTime.trim() ? form.valueDateTime.trim() : null,
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Data input value created" });
      } else {
        await updateDataInputValue(asset.assetId, selectedInputParameterId, editing.dataInputValueId, {
          valueText: form.valueText.trim() ? form.valueText.trim() : null,
          valueNumber: num,
          valueDateTime: form.valueDateTime.trim() ? form.valueDateTime.trim() : null,
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Data input value updated" });
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
      { key: "text", header: "Text", render: (r) => <span className="text-sm">{r.valueText ?? "-"}</span> },
      { key: "number", header: "Number", render: (r) => <span className="font-mono text-xs">{r.valueNumber ?? "-"}</span> },
      { key: "datetime", header: "Date/Time", render: (r) => <span className="text-sm">{r.valueDateTime ?? "-"}</span> },
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
        <div className="text-sm font-semibold">Data Input</div>
        <div className="muted mt-1">Manage data input values for the selected input parameter.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to manage Data
          Input values.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Data Input"
        description="Manage data input values for the selected input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No data input values"
        emptyMessage="No data input values were found for the selected input parameter."
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Data Input"
            description={`InputParameterId: ${selectedInputParameterId}`}
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Value"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.dataInputValueId} emptyLabel="No data input values." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Data Input Value" : "Create Data Input Value"}
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
            label="Value Text (optional)"
            value={form.valueText}
            onChange={(v) => setForm((s) => ({ ...s, valueText: v }))}
            error={fieldErrors.valueText}
          />
          <FormInput
            label="Value Number (optional)"
            value={form.valueNumber}
            onChange={(v) => setForm((s) => ({ ...s, valueNumber: v }))}
            error={fieldErrors.valueNumber}
          />
          <FormInput
            label="Value Date/Time (optional)"
            value={form.valueDateTime}
            onChange={(v) => setForm((s) => ({ ...s, valueDateTime: v }))}
            error={fieldErrors.valueDateTime}
            placeholder="ISO date/time"
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
