import { useEffect, useMemo, useState } from "react";
import {
  createReportingAttributeMapping,
  listReportingAttributeMappings,
  queryReportingProgramMasters,
  updateReportingAttributeMapping,
} from "../../../api/endpoints";
import type { ReportingAttributeMappingDto, ReportingProgramMasterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = ReportingAttributeMappingDto;

function buildProgramIndex(masters: ReportingProgramMasterDto[]): Map<string, ReportingProgramMasterDto> {
  const m = new Map<string, ReportingProgramMasterDto>();
  for (const p of masters) m.set(p.reportingProgramId, p);
  return m;
}

// PUBLIC_INTERFACE
export function ReportingAttributesMappingTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Reporting Attributes Mapping CRUD
   * Backend:
   *  - GET/POST /api/assets/{assetId}/reporting-attribute-mappings
   *  - PUT /api/assets/{assetId}/reporting-attribute-mappings/{reportingAttributeMappingId}
   * Masters:
   *  - GET /api/masters/reporting-programs
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [programs, setPrograms] = useState<ReportingProgramMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    reportingProgramId: "",
    reportingAttributeName: "",
    reportingAttributeValue: "",
    isActive: true,
  });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const mappings = await listReportingAttributeMappings(asset.assetId);
    setRows(mappings);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const [mappings, masters] = await Promise.all([
          listReportingAttributeMappings(asset.assetId),
          queryReportingProgramMasters({ activeOnly: true, limit: 1000 }),
        ]);
        if (!mounted) return;
        setRows(mappings);
        setPrograms(masters);
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

  const programIndex = useMemo(() => buildProgramIndex(programs), [programs]);

  function openCreate(): void {
    setEditing(null);
    setForm({ reportingProgramId: "", reportingAttributeName: "", reportingAttributeValue: "", isActive: true });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      reportingProgramId: r.reportingProgramId !== null && r.reportingProgramId !== undefined ? String(r.reportingProgramId) : "",
      reportingAttributeName: r.reportingAttributeName ?? "",
      reportingAttributeValue: r.reportingAttributeValue ?? "",
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
      reportingProgramId: form.reportingProgramId,
      reportingAttributeName: form.reportingAttributeName,
      reportingAttributeValue: form.reportingAttributeValue,
    });

    const rp = requireInt(form.reportingProgramId, "Reporting Program");
    if (rp.error) reqErrors.reportingProgramId = rp.error;

    if (Object.keys(reqErrors).length > 0) {
      setFieldErrors(reqErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();

      if (!editing) {
        await createReportingAttributeMapping(asset.assetId, {
          reportingProgramId: rp.value!,
          reportingAttributeName: form.reportingAttributeName.trim(),
          reportingAttributeValue: form.reportingAttributeValue.trim(),
          isActive: form.isActive,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Reporting attribute created" });
      } else {
        await updateReportingAttributeMapping(asset.assetId, editing.reportingAttributeMappingId, {
          reportingProgramId: rp.value!,
          reportingAttributeName: form.reportingAttributeName.trim(),
          reportingAttributeValue: form.reportingAttributeValue.trim(),
          isActive: form.isActive,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Reporting attribute updated" });
      }

      await reload();
      setModalOpen(false);
    } catch (e) {
      const ex = extractErrors(e);
      setBanner({ title: ex.title, message: ex.message });
      setFieldErrors(ex.fieldErrors);
      // Backend enforces uniqueness; surface the message prominently.
      if (ex.title.toLowerCase().includes("duplicate") || ex.title.toLowerCase().includes("conflict")) {
        pushToast({
          type: "error",
          title: "Uniqueness conflict",
          message: ex.message || "Duplicate reporting attribute combination is not allowed.",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Row>[] = useMemo(
    () => [
      {
        key: "program",
        header: "Reporting Program",
        render: (r) => {
          const id = r.reportingProgramId ?? null;
          const p = id !== null ? programIndex.get(String(id)) : undefined;
          return (
            <div>
              <div className="text-sm font-semibold">{p?.programName ?? "Unknown program"}</div>
              <div className="muted text-xs">ID: <span className="font-mono">{id ?? "-"}</span></div>
            </div>
          );
        },
      },
      { key: "name", header: "Attribute", render: (r) => <span className="text-sm font-semibold">{r.reportingAttributeName ?? "-"}</span> },
      { key: "value", header: "Value", render: (r) => <span className="text-sm">{r.reportingAttributeValue ?? "-"}</span> },
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
    [caps.canEdit, programIndex],
  );

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Reporting Attributes Mapping"
        description="BRD-required reporting attributes mapping module."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No reporting attribute mappings"
        emptyMessage="No reporting attribute mappings were found for this asset."
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Reporting Attributes Mapping"
            description="Map reporting attributes to reporting programs (unique combinations enforced)."
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Attribute"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.reportingAttributeMappingId} emptyLabel="No reporting attribute mappings." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Reporting Attribute" : "Create Reporting Attribute"}
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
          <label className="block">
            <div className="label">Reporting Program</div>
            <select
              className="input mt-1"
              value={form.reportingProgramId}
              onChange={(e) => setForm((s) => ({ ...s, reportingProgramId: e.target.value }))}
            >
              <option value="">Select…</option>
              {programs.map((p) => (
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
            label="Attribute Name"
            value={form.reportingAttributeName}
            onChange={(v) => setForm((s) => ({ ...s, reportingAttributeName: v }))}
            error={fieldErrors.reportingAttributeName}
          />

          <FormInput
            label="Attribute Value"
            value={form.reportingAttributeValue}
            onChange={(v) => setForm((s) => ({ ...s, reportingAttributeValue: v }))}
            error={fieldErrors.reportingAttributeValue}
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
