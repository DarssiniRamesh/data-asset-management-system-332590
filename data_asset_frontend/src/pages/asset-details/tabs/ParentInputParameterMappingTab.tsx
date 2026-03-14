import { useEffect, useMemo, useState } from "react";
import {
  createParentInputMapping,
  listParentInputMappings,
  updateParentInputMapping,
} from "../../../api/endpoints";
import type { ParentInputMappingDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { roleLabel } from "../../../lib/rbac";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt } from "../crud/crudFormUtils";

type Row = ParentInputMappingDto;

// PUBLIC_INTERFACE
export function ParentInputParameterMappingTab({ asset, caps }: AssetDetailsTabProps) {
  /** Contract:
   * Purpose:
   *  - Parent mapping module for the selected child input parameter (BRD dependency after Input Parameters).
   * Backend:
   *  - GET /api/assets/{assetId}/input-parameters/{childInputParameterId}/parent-input-mappings
   *  - POST /api/assets/{assetId}/input-parameters/{childInputParameterId}/parent-input-mappings
   *  - PUT /api/assets/{assetId}/input-parameters/{childInputParameterId}/parent-input-mappings/{parentInputMappingId}
   * RBAC:
   *  - Viewer: read-only
   */
  const { selectedInputParameterId } = useInputParameterSelection();
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    if (!selectedInputParameterId) return;
    const list = await listParentInputMappings(asset.assetId, selectedInputParameterId);
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
        const list = await listParentInputMappings(asset.assetId, selectedInputParameterId);
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

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "parentId",
        header: "Parent Input Parameter ID",
        render: (r) => <span className="font-mono text-xs">{r.parentInputParameterId ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => <span className="text-sm">{(r.isActive ?? true) ? "Yes" : "No"}</span>,
      },
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
            <button
              type="button"
              className="btn-ghost opacity-60"
              disabled
              title="Edit requires Editor or Admin role"
            >
              Edit
            </button>
          ),
      },
    ],
    [caps.canEdit],
  );

  function openCreate(): void {
    setEditing(null);
    setParentId("");
    setIsActive(true);
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setParentId(r.parentInputParameterId !== null && r.parentInputParameterId !== undefined ? String(r.parentInputParameterId) : "");
    setIsActive(r.isActive ?? true);
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

    const parsed = requireInt(parentId, "Parent Input Parameter ID");
    if (parsed.error || parsed.value === null) {
      setFieldErrors({ parentInputParameterId: parsed.error || "Required" });
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();

      if (!editing) {
        await createParentInputMapping(asset.assetId, selectedInputParameterId, {
          parentInputParameterId: parsed.value,
          isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Parent mapping created" });
      } else {
        await updateParentInputMapping(asset.assetId, selectedInputParameterId, editing.parentInputMappingId, {
          parentInputParameterId: parsed.value,
          isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Parent mapping updated" });
      }

      await reload();
      setModalOpen(false);
    } catch (e) {
      const ex = extractErrors(e);
      setBanner({ title: ex.title, message: ex.message });
      setFieldErrors(ex.fieldErrors);
      if (ex.remediation) pushToast({ type: "error", title: ex.title, message: ex.remediation });
    } finally {
      setSaving(false);
    }
  }

  if (!selectedInputParameterId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Parent Input Parameter Mapping</div>
        <div className="muted mt-1">Select an input parameter in Associated Input Parameters to view mappings.</div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in <span className="font-semibold">Associated Input Parameters</span> to view Parent
          Input Parameter Mapping.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Parent Input Parameter Mapping"
        description="BRD-required parent mapping module for the selected child input parameter."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No parent mappings"
        emptyMessage="No parent mappings were found for the selected input parameter."
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Parent Input Parameter Mapping"
            description={`Child inputParameterId: ${selectedInputParameterId}`}
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Mapping"
          />

          <DataTable<Row>
            columns={columns}
            rows={rows}
            rowKey={(r) => r.parentInputMappingId}
            emptyLabel="No parent mappings."
          />

          {!caps.canEdit ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Read-only mode ({roleLabel(caps.isViewer ? "Viewer" : undefined)}): editing is disabled.
            </div>
          ) : null}
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Parent Input Mapping" : "Create Parent Input Mapping"}
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
            label="Parent Input Parameter ID"
            value={parentId}
            onChange={setParentId}
            error={fieldErrors.parentInputParameterId}
            placeholder="Numeric ID"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
