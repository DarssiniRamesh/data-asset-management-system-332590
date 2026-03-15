import { useEffect, useMemo, useState } from "react";
import {
  createEfSourceMapping,
  listEfSourceMappings,
  updateEfSourceMapping,
} from "../../../api/endpoints";
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

  // NOTE:
  // ef_source_mapping table uses ef_source_set_or_table (NOT ef_source_id).
  // This is the user-editable "EF Source (set/table)" that must never be blank.
  const [form, setForm] = useState({
    efSourceSetOrTable: "",
    equationSetup: "",
    scalarValues: "",
    isActive: true, // UI-only (for now); backend currently ignores in this table.
  });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    if (!selectedInputParameterId) return;
    const list = await listEfSourceMappings(
      asset.assetId,
      selectedInputParameterId,
    );
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
        const list = await listEfSourceMappings(
          asset.assetId,
          selectedInputParameterId,
        );
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
    setForm({
      efSourceSetOrTable: "",
      equationSetup: "",
      scalarValues: "",
      isActive: true,
    });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      efSourceSetOrTable: r.efSourceSetOrTable ?? "",
      equationSetup: r.equationSetup ?? "",
      scalarValues: r.scalarValues ?? "",
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

    // Frontend validation (fast feedback)
    const reqErrors = validateRequiredStrings({
      efSourceSetOrTable: form.efSourceSetOrTable,
    });
    if (Object.keys(reqErrors).length > 0) {
      setFieldErrors(reqErrors);
      setBanner({
        title: "Validation failed",
        message: "Please correct the highlighted fields.",
      });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();

      const payload = {
        efSourceSetOrTable: form.efSourceSetOrTable.trim(),
        equationSetup: form.equationSetup.trim() ? form.equationSetup.trim() : null,
        scalarValues: form.scalarValues.trim() ? form.scalarValues.trim() : null,
        // reportingProgramId is optional; backend derives it when omitted.
      };

      if (!editing) {
        await createEfSourceMapping(asset.assetId, selectedInputParameterId, {
          ...payload,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "EF source mapping created" });
      } else {
        await updateEfSourceMapping(
          asset.assetId,
          selectedInputParameterId,
          editing.efSourceMappingId,
          {
            ...payload,
            modifiedBy: user.username,
            correlationId,
          },
        );
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
      {
        key: "efSourceSetOrTable",
        header: "EF Source (set/table)",
        render: (r) => (
          <span className="font-mono text-xs">{r.efSourceSetOrTable ?? "-"}</span>
        ),
      },
      {
        key: "equationSetup",
        header: "Equation Setup",
        render: (r) => (
          <span className="text-sm">{r.equationSetup?.trim() || "-"}</span>
        ),
      },
      {
        key: "scalarValues",
        header: "Scalar Values",
        render: (r) => (
          <span className="text-sm">{r.scalarValues?.trim() || "-"}</span>
        ),
      },
      {
        key: "actions",
        header: "",
        widthClassName: "w-28",
        render: (r) =>
          caps.canEdit ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => openEdit(r)}
            >
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

  if (!selectedInputParameterId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">EF Source Mapping</div>
        <div className="muted mt-1">
          Configure EF source mapping for the selected input parameter.
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          Select an input parameter in{" "}
          <span className="font-semibold">Associated Input Parameters</span> to
          configure EF Source Mapping.
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
              Next step: add an EF Source (set/table) for InputParameterId{" "}
              <span className="font-mono font-semibold">
                {selectedInputParameterId}
              </span>
              .
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

          <DataTable<Row>
            columns={columns}
            rows={rows}
            rowKey={(r) => r.efSourceMappingId}
            emptyLabel="No EF source mappings."
          />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit EF Source Mapping" : "Create EF Source Mapping"}
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <>
            <button
              className="btn-ghost"
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={onSave}
              disabled={saving}
            >
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
          <div>
            <FormInput
              label="EF Source (set/table)"
              value={form.efSourceSetOrTable}
              onChange={(v) => setForm((s) => ({ ...s, efSourceSetOrTable: v }))}
              placeholder="Example: ef_emissions_factors (table) or vw_ef_sources (view)"
              error={fieldErrors.efSourceSetOrTable}
            />
            <div className="muted mt-1 text-xs">
              Enter the EF source identifier your team uses (usually the database{" "}
              <span className="font-mono">table</span> or <span className="font-mono">view</span>{" "}
              name). This field is required and cannot be blank.
            </div>
          </div>

          <div>
            <FormInput
              label="Equation Setup"
              value={form.equationSetup}
              onChange={(v) => setForm((s) => ({ ...s, equationSetup: v }))}
              placeholder="Optional. Example: CO2e = Activity * EF * GWP"
              error={fieldErrors.equationSetup}
            />
            <div className="muted mt-1 text-xs">
              Optional: brief description of how the EF is applied (formula, notes, assumptions).
            </div>
          </div>

          <div>
            <FormInput
              label="Scalar Values"
              value={form.scalarValues}
              onChange={(v) => setForm((s) => ({ ...s, scalarValues: v }))}
              placeholder="Optional. Example: {GWP: 25, unit: kgCO2e/MMBtu}"
              error={fieldErrors.scalarValues}
            />
            <div className="muted mt-1 text-xs">
              Optional: any scalars/parameters used by the equation (free text or JSON).
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
