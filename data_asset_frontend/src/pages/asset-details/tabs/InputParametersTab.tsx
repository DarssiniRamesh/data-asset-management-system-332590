import { useEffect, useMemo, useState } from "react";
import {
  createInputParameter,
  listInputParameters,
  queryReportingProgramMasters,
  queryUomMasters,
  updateInputParameter,
} from "../../../api/endpoints";
import type {
  CreateInputParameterRequest,
  InputParameterDto,
  ReportingProgramMasterDto,
  UomMasterDto,
} from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { LoaderSpinner } from "../../../components/LoaderSpinner";
import { Modal } from "../../../components/Modal";
import { roleLabel } from "../../../lib/rbac";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { useInputParameterSelection } from "../InputParameterSelectionContext";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = InputParameterDto;

function toSelectOptions<T extends { isActive?: boolean }>(
  rows: T[],
): T[] {
  return rows.filter((r) => (r.isActive ?? true) === true);
}

// PUBLIC_INTERFACE
export function InputParametersTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD step 04.01 + CRUD
   * Purpose:
   *  - Canonical selector for current input parameter (drives EF/Throughput/Data Input tabs)
   *  - Implements Create/Edit via modal dialogs (BRD-sequenced)
   * Backend:
   *  - GET /api/assets/{assetId}/input-parameters
   *  - POST /api/assets/{assetId}/input-parameters
   *  - PUT /api/assets/{assetId}/input-parameters/{inputParameterId}
   * RBAC:
   *  - Viewer: read-only (no create/edit)
   * Validation:
   *  - Client-side required: inputParameterName, createdBy/modifiedBy, correlationId
   *  - Server-side: authoritative; show field errors + banner
   */
  const { pushToast } = useToasts();
  const { user } = useAuth();
  const { selectedInputParameterId, setSelectedInputParameterId } =
    useInputParameterSelection();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // masters for dropdowns
  const [uoms, setUoms] = useState<UomMasterDto[]>([]);
  const [programs, setPrograms] = useState<ReportingProgramMasterDto[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [form, setForm] = useState({
    inputParameterName: "",
    uomId: "",
    reportingProgramId: "",
    inputType: "",
    dataEntryFrequency: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const list = await listInputParameters(asset.assetId);
    setRows(list);

    if (list.length > 0) {
      const stillExists = selectedInputParameterId
        ? list.some((r) => r.inputParameterId === selectedInputParameterId)
        : false;
      if (!selectedInputParameterId || !stillExists) {
        setSelectedInputParameterId(list[0].inputParameterId);
      }
    } else {
      setSelectedInputParameterId(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      try {
        // Keep this effect stable: all referenced functions/values are in deps below.
        const [u, p, list] = await Promise.all([
          queryUomMasters({ activeOnly: true, limit: 1000 }),
          queryReportingProgramMasters({ activeOnly: true, limit: 1000 }),
          listInputParameters(asset.assetId),
        ]);

        if (!mounted) return;

        setUoms(u);
        setPrograms(p);
        setRows(list);

        if (list.length > 0) {
          const stillExists = selectedInputParameterId
            ? list.some((r) => r.inputParameterId === selectedInputParameterId)
            : false;
          if (!selectedInputParameterId || !stillExists) {
            setSelectedInputParameterId(list[0].inputParameterId);
          }
        } else {
          setSelectedInputParameterId(null);
        }
      } catch (e) {
        const parsed = extractErrors(e);
        pushToast({ type: "error", title: parsed.title, message: parsed.message });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [
    asset.assetId,
    pushToast,
    selectedInputParameterId,
    setSelectedInputParameterId,
  ]);

  function openCreate(): void {
    setEditing(null);
    setBanner(null);
    setFieldErrors({});
    setForm({
      inputParameterName: "",
      uomId: "",
      reportingProgramId: "",
      inputType: "",
      dataEntryFrequency: "",
      isActive: true,
    });
    setModalOpen(true);
  }

  function openEdit(row: Row): void {
    setEditing(row);
    setBanner(null);
    setFieldErrors({});
    setForm({
      inputParameterName: row.inputParameterName || "",
      uomId: row.uomId !== null && row.uomId !== undefined ? String(row.uomId) : "",
      reportingProgramId:
        row.reportingProgramId !== null && row.reportingProgramId !== undefined
          ? String(row.reportingProgramId)
          : "",
      inputType: row.inputType ?? "",
      dataEntryFrequency: row.dataEntryFrequency ?? "",
      isActive: row.isActive ?? true,
    });
    setModalOpen(true);
  }

  async function onSave(): Promise<void> {
    if (!user?.username) {
      setBanner({ title: "Not signed in", message: "Please login again." });
      return;
    }

    setBanner(null);
    setFieldErrors({});

    const requiredErrors = validateRequiredStrings({
      inputParameterName: form.inputParameterName,
    });

    // validate number fields (optional)
    const uom = form.uomId ? requireInt(form.uomId, "UOM") : { value: null as number | null };
    const prog = form.reportingProgramId
      ? requireInt(form.reportingProgramId, "Reporting Program")
      : { value: null as number | null };

    if (uom.error) requiredErrors.uomId = uom.error;
    if (prog.error) requiredErrors.reportingProgramId = prog.error;

    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();

      if (!editing) {
        const req: CreateInputParameterRequest = {
          inputParameterName: form.inputParameterName.trim(),
          uomId: uom.value,
          reportingProgramId: prog.value,
          inputType: form.inputType.trim() ? form.inputType.trim() : null,
          dataEntryFrequency: form.dataEntryFrequency.trim()
            ? form.dataEntryFrequency.trim()
            : null,
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        };
        const created = await createInputParameter(asset.assetId, req);
        pushToast({ type: "success", title: "Input parameter created" });
        await reload();
        setSelectedInputParameterId(created.inputParameterId);
        setModalOpen(false);
      } else {
        const req = {
          inputParameterName: form.inputParameterName.trim(),
          uomId: uom.value,
          reportingProgramId: prog.value,
          inputType: form.inputType.trim() ? form.inputType.trim() : null,
          dataEntryFrequency: form.dataEntryFrequency.trim()
            ? form.dataEntryFrequency.trim()
            : null,
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        };
        await updateInputParameter(asset.assetId, editing.inputParameterId, req);
        pushToast({ type: "success", title: "Input parameter updated" });
        await reload();
        setModalOpen(false);
      }
    } catch (e) {
      const parsed = extractErrors(e);
      setBanner({ title: parsed.title, message: parsed.message });
      setFieldErrors(parsed.fieldErrors);
      if (parsed.remediation) {
        pushToast({ type: "error", title: parsed.title, message: parsed.remediation });
      }
    } finally {
      setSaving(false);
    }
  }

  const activeUoms = useMemo(() => toSelectOptions(uoms), [uoms]);
  const activePrograms = useMemo(() => toSelectOptions(programs), [programs]);

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "selected",
        header: "",
        widthClassName: "w-10",
        render: (r) => {
          const isSelected = r.inputParameterId === selectedInputParameterId;
          return (
            <div className="flex items-center justify-center">
              <input
                type="radio"
                aria-label={`Select ${r.inputParameterName || r.inputParameterId}`}
                checked={isSelected}
                onChange={() => setSelectedInputParameterId(r.inputParameterId)}
              />
            </div>
          );
        },
      },
      {
        key: "name",
        header: "Input Parameter",
        render: (r) => (
          <button
            type="button"
            className="text-left font-semibold text-slate-900 hover:underline dark:text-slate-100"
            onClick={() => setSelectedInputParameterId(r.inputParameterId)}
          >
            {r.inputParameterName || "(Unnamed)"}
            <div className="muted text-xs font-normal">ID: {r.inputParameterId}</div>
          </button>
        ),
      },
      {
        key: "uom",
        header: "UOM",
        render: (r) => <span className="text-sm">{r.uomId ?? "-"}</span>,
      },
      {
        key: "active",
        header: "Active",
        render: (r) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              (r.isActive ?? true)
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300"
            }`}
          >
            {(r.isActive ?? true) ? "Yes" : "No"}
          </span>
        ),
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
              title={`Edit requires Editor/Admin (current: ${roleLabel(caps.isViewer ? "Viewer" : undefined)})`}
            >
              Edit
            </button>
          ),
      },
    ],
    [caps.canEdit, caps.isViewer, selectedInputParameterId, setSelectedInputParameterId],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <CrudActionBar
          title="Associated Input Parameters"
          description="Select an input parameter. This selection drives EF Source Mapping, Throughput Setup, and Data Input tabs."
          caps={caps}
          canCreate={caps.canCreate}
          onCreate={openCreate}
          createLabel="Create Input Parameter"
        />

        <div className="mt-4">
          {loading ? (
            <LoaderSpinner label="Loading input parameters..." />
          ) : (
            <DataTable<Row>
              columns={columns}
              rows={rows}
              rowKey={(r) => r.inputParameterId}
              emptyLabel="No input parameters found for this asset."
            />
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Current selection
          </div>
          <div className="mt-1">
            {selectedInputParameterId ? (
              <>
                Input Parameter ID:{" "}
                <span className="font-mono font-semibold">{selectedInputParameterId}</span>
              </>
            ) : (
              <span className="muted">None selected.</span>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Input Parameter" : "Create Input Parameter"}
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

          <label className="block">
            <div className="label">UOM (optional)</div>
            <select
              className="input mt-1"
              value={form.uomId}
              onChange={(e) => setForm((s) => ({ ...s, uomId: e.target.value }))}
            >
              <option value="">—</option>
              {activeUoms.map((u) => (
                <option key={u.uomId} value={u.uomId}>
                  {u.uomCode ? `${u.uomCode} — ` : ""}{u.uomName || u.uomId}
                </option>
              ))}
            </select>
            {fieldErrors.uomId ? <div className="mt-1 text-sm text-red-600">{fieldErrors.uomId}</div> : null}
          </label>

          <label className="block">
            <div className="label">Reporting Program (optional)</div>
            <select
              className="input mt-1"
              value={form.reportingProgramId}
              onChange={(e) => setForm((s) => ({ ...s, reportingProgramId: e.target.value }))}
            >
              <option value="">—</option>
              {activePrograms.map((p) => (
                <option key={p.reportingProgramId} value={p.reportingProgramId}>
                  {p.programName || p.reportingProgramId}
                </option>
              ))}
            </select>
            {fieldErrors.reportingProgramId ? (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.reportingProgramId}</div>
            ) : null}
          </label>

          <FormInput
            label="Input Type (optional)"
            value={form.inputType}
            onChange={(v) => setForm((s) => ({ ...s, inputType: v }))}
            error={fieldErrors.inputType}
          />

          <FormInput
            label="Data Entry Frequency (optional)"
            value={form.dataEntryFrequency}
            onChange={(v) => setForm((s) => ({ ...s, dataEntryFrequency: v }))}
            error={fieldErrors.dataEntryFrequency}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
