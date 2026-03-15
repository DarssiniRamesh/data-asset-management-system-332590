import { useEffect, useMemo, useState } from "react";
import {
  createInputParameter,
  listInputParameters,
  queryReportingProgramMasters,
  queryUomMasters,
  updateInputParameter,
} from "../../../api/endpoints";
import type { InputParameterDto, ReportingProgramMasterDto, UomMasterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { FormSelect } from "../../../components/FormSelect";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = InputParameterDto;

function buildUomIndex(masters: UomMasterDto[]): Map<string, UomMasterDto> {
  const m = new Map<string, UomMasterDto>();
  for (const u of masters) m.set(u.uomId, u);
  return m;
}

function buildProgIndex(masters: ReportingProgramMasterDto[]): Map<string, ReportingProgramMasterDto> {
  const m = new Map<string, ReportingProgramMasterDto>();
  for (const p of masters) m.set(p.reportingProgramId, p);
  return m;
}

// PUBLIC_INTERFACE
export function InputParametersTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Associated Input Parameters
   * Backend:
   *  - GET/POST /api/assets/{assetId}/input-parameters
   *  - PUT /api/assets/{assetId}/input-parameters/{inputParameterId}
   * Masters:
   *  - GET /api/masters/uoms
   *  - GET /api/masters/reporting-programs
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();
  const { selectedInputParameterId, setSelectedInputParameterId } = useInputParameterSelection();

  const [rows, setRows] = useState<Row[]>([]);
  const [uoms, setUoms] = useState<UomMasterDto[]>([]);
  const [programs, setPrograms] = useState<ReportingProgramMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    inputParameterName: "",
    uomId: "",
    reportingProgramId: "",
    inputType: "",
    dataEntryFrequency: "",
    isActive: true,
  });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const list = await listInputParameters(asset.assetId);
    setRows(list);

    // Keep selection valid if a row was deleted/changed elsewhere
    if (selectedInputParameterId && !list.some((r) => r.inputParameterId === selectedInputParameterId)) {
      setSelectedInputParameterId(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [list, uomMasters, progMasters] = await Promise.all([
          listInputParameters(asset.assetId),
          queryUomMasters({ activeOnly: true, limit: 1000 }),
          queryReportingProgramMasters({ activeOnly: true, limit: 1000 }),
        ]);

        if (!mounted) return;
        setRows(list);
        setUoms(uomMasters);
        setPrograms(progMasters);

        // Default selection: first row
        if (!selectedInputParameterId && list.length > 0) {
          setSelectedInputParameterId(list[0].inputParameterId);
        }
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
  }, [asset.assetId, selectedInputParameterId, setSelectedInputParameterId]);

  const uomIndex = useMemo(() => buildUomIndex(uoms), [uoms]);
  const progIndex = useMemo(() => buildProgIndex(programs), [programs]);

  function openCreate(): void {
    setEditing(null);
    setForm({
      inputParameterName: "",
      uomId: "",
      reportingProgramId: "",
      inputType: "",
      dataEntryFrequency: "",
      isActive: true,
    });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      inputParameterName: r.inputParameterName ?? "",
      uomId: r.uomId !== null && r.uomId !== undefined ? String(r.uomId) : "",
      reportingProgramId: r.reportingProgramId !== null && r.reportingProgramId !== undefined ? String(r.reportingProgramId) : "",
      inputType: r.inputType ?? "",
      dataEntryFrequency: r.dataEntryFrequency ?? "",
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
      inputParameterName: form.inputParameterName,
    });

    // These are optional in the backend API, but BRD expects dropdowns to be used when available.
    // We'll validate type/frequency lightly to keep UX consistent without blocking legacy cases.
    // (If BRD later marks them mandatory, make them required here.)
    if (form.uomId) {
      const u = requireInt(form.uomId, "UOM");
      if (u.error) reqErrors.uomId = u.error;
    }
    if (form.reportingProgramId) {
      const p = requireInt(form.reportingProgramId, "Reporting Program");
      if (p.error) reqErrors.reportingProgramId = p.error;
    }

    if (Object.keys(reqErrors).length > 0) {
      setFieldErrors(reqErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      const uom = form.uomId ? requireInt(form.uomId, "UOM").value : null;
      const prog = form.reportingProgramId ? requireInt(form.reportingProgramId, "Reporting Program").value : null;

      if (!editing) {
        const created = await createInputParameter(asset.assetId, {
          inputParameterName: form.inputParameterName.trim(),
          uomId: uom,
          reportingProgramId: prog,
          inputType: form.inputType.trim() ? form.inputType.trim() : null,
          dataEntryFrequency: form.dataEntryFrequency.trim() ? form.dataEntryFrequency.trim() : null,
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Input parameter created" });
        await reload();
        setSelectedInputParameterId(created.inputParameterId);
      } else {
        await updateInputParameter(asset.assetId, editing.inputParameterId, {
          inputParameterName: form.inputParameterName.trim(),
          uomId: uom,
          reportingProgramId: prog,
          inputType: form.inputType.trim() ? form.inputType.trim() : null,
          dataEntryFrequency: form.dataEntryFrequency.trim() ? form.dataEntryFrequency.trim() : null,
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Input parameter updated" });
        await reload();
      }

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
        key: "name",
        header: "Input Parameter",
        render: (r) => (
          <button
            type="button"
            className={`text-left ${r.inputParameterId === selectedInputParameterId ? "font-semibold" : ""}`}
            onClick={() => setSelectedInputParameterId(r.inputParameterId)}
          >
            <div className="text-sm">{r.inputParameterName || "-"}</div>
            <div className="muted text-xs">
              ID: <span className="font-mono">{r.inputParameterId}</span>
              {r.inputParameterId === selectedInputParameterId ? " (selected)" : ""}
            </div>
          </button>
        ),
      },
      {
        key: "uom",
        header: "UOM",
        render: (r) => {
          const id = r.uomId !== null && r.uomId !== undefined ? String(r.uomId) : "";
          const u = id ? uomIndex.get(id) : undefined;
          return <span className="text-sm">{u?.uomCode ?? u?.uomName ?? (id || "-")}</span>;
        },
      },
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
    [caps.canEdit, selectedInputParameterId, setSelectedInputParameterId, uomIndex],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Associated Input Parameters"
        description="Select an input parameter. This selection drives EF Source Mapping, Throughput Setup, and Data Input tabs."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No input parameters"
        emptyMessage="Create at least one input parameter to continue configuration."
        emptyActions={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs opacity-80">
              Next step: create an input parameter (name + optional UOM + optional reporting program).
            </div>
            {caps.canCreate ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                Create Input Parameter
              </button>
            ) : (
              <button type="button" className="btn-primary opacity-60" disabled title="Create requires Editor or Admin role">
                Create Input Parameter
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Input Parameters"
            description={selectedInputParameterId ? `Current selection: ${selectedInputParameterId}` : "Select a row to drive dependent tabs."}
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Input Parameter"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.inputParameterId} emptyLabel="No input parameters." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Input Parameter" : "Create Input Parameter"}
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
            label="Input Parameter Name"
            value={form.inputParameterName}
            onChange={(v) => setForm((s) => ({ ...s, inputParameterName: v }))}
            error={fieldErrors.inputParameterName}
          />

          <FormSelect
            label="UOM (optional)"
            value={form.uomId}
            onChange={(v) => setForm((s) => ({ ...s, uomId: v }))}
            options={uoms.map((u) => ({
              value: u.uomId,
              label: `${u.uomCode ? `${u.uomCode} — ` : ""}${(u.uomName || u.uomId) as string}`,
            }))}
            error={fieldErrors.uomId}
            placeholder="—"
            helpText={uoms.length === 0 ? "No active UOM masters were returned. Check master data setup." : null}
          />

          <FormSelect
            label="Reporting Program (optional)"
            value={form.reportingProgramId}
            onChange={(v) => setForm((s) => ({ ...s, reportingProgramId: v }))}
            options={programs.map((p) => ({
              value: p.reportingProgramId,
              label: (p.programName || p.reportingProgramId) as string,
            }))}
            error={fieldErrors.reportingProgramId}
            placeholder="—"
            helpText={programs.length === 0 ? "No active reporting programs were returned. Check master data setup." : null}
          />

          <FormInput
            label="Input Type (optional)"
            value={form.inputType}
            onChange={(v) => setForm((s) => ({ ...s, inputType: v }))}
            error={fieldErrors.inputType}
            placeholder="e.g., Calculated, Manual, Sensor"
          />

          <FormInput
            label="Data Entry Frequency (optional)"
            value={form.dataEntryFrequency}
            onChange={(v) => setForm((s) => ({ ...s, dataEntryFrequency: v }))}
            error={fieldErrors.dataEntryFrequency}
            placeholder="e.g., Hourly, Daily, Monthly"
          />

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
            Active
          </label>

          {selectedInputParameterId ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              Current selection drives dependent tabs: EF Source Mapping, Throughput Setup, Data Input.
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
