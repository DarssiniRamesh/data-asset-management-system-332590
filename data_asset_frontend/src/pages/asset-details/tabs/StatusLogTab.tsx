import { useEffect, useMemo, useState } from "react";
import {
  createAssetStatusLog,
  listAssetStatusLogs,
  queryStatusCodeMasters,
  updateAssetStatusLog,
} from "../../../api/endpoints";
import type { AssetStatusLogDto, StatusCodeMasterDto } from "../../../api/types";
import { DataTable, type Column } from "../../../components/DataTable";
import { FormInput } from "../../../components/FormInput";
import { Modal } from "../../../components/Modal";
import { useAuth } from "../../../state/AuthContext";
import { useToasts } from "../../../state/ToastContext";
import type { AssetDetailsTabProps } from "../AssetDetailsTab";
import { TabStatePanel } from "../TabStatePanel";
import { AuthRequiredPanel, shouldShowAuthRequired } from "../AuthRequiredPanel";
import { CrudActionBar } from "../crud/CrudActionBar";
import { extractErrors, requireInt, validateRequiredStrings } from "../crud/crudFormUtils";

type Row = AssetStatusLogDto;

// PUBLIC_INTERFACE
export function StatusLogTab({ asset, caps }: AssetDetailsTabProps) {
  /** BRD: Status Log CRUD
   * Backend:
   *  - GET /api/assets/{assetId}/status-logs
   *  - POST /api/assets/{assetId}/status-logs
   *  - PUT /api/assets/{assetId}/status-logs/{assetStatusLogId}
   * Masters:
   *  - GET /api/masters/status-codes
   */
  const { user } = useAuth();
  const { pushToast } = useToasts();

  const [rows, setRows] = useState<Row[]>([]);
  const [statusCodes, setStatusCodes] = useState<StatusCodeMasterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    statusCodeId: "",
    statusStartDate: "",
    statusEndDate: "",
    comment: "",
  });
  const [banner, setBanner] = useState<{ title: string; message?: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function reload(): Promise<void> {
    const list = await listAssetStatusLogs(asset.assetId);
    setRows(list);
  }

  useEffect(() => {
    let mounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const [list, masters] = await Promise.all([
          listAssetStatusLogs(asset.assetId),
          queryStatusCodeMasters({ activeOnly: true, limit: 1000 }),
        ]);
        if (!mounted) return;
        setRows(list);
        setStatusCodes(masters);
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

  const statusCodeIndex = useMemo(() => {
    const m = new Map<string, StatusCodeMasterDto>();
    for (const s of statusCodes) m.set(String(s.statusCodeId), s);
    return m;
  }, [statusCodes]);

  function openCreate(): void {
    setEditing(null);
    setForm({ statusCodeId: "", statusStartDate: "", statusEndDate: "", comment: "" });
    setBanner(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Row): void {
    setEditing(r);
    setForm({
      statusCodeId: r.statusCodeId !== null && r.statusCodeId !== undefined ? String(r.statusCodeId) : "",
      statusStartDate: r.statusStartDate ?? "",
      statusEndDate: r.statusEndDate ?? "",
      comment: r.comment ?? "",
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

    const requiredErrors = validateRequiredStrings({
      statusCodeId: form.statusCodeId,
      statusStartDate: form.statusStartDate,
    });

    const code = requireInt(form.statusCodeId, "Status Code");
    if (code.error) requiredErrors.statusCodeId = code.error;

    if (Object.keys(requiredErrors).length > 0) {
      setFieldErrors(requiredErrors);
      setBanner({ title: "Validation failed", message: "Please correct the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const correlationId = crypto.randomUUID();
      if (!editing) {
        await createAssetStatusLog(asset.assetId, {
          statusCodeId: code.value!,
          statusStartDate: form.statusStartDate,
          statusEndDate: form.statusEndDate.trim() ? form.statusEndDate : null,
          comment: form.comment.trim() ? form.comment : null,
          createdBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Status log entry created" });
      } else {
        await updateAssetStatusLog(asset.assetId, editing.assetStatusLogId, {
          statusCodeId: code.value!,
          statusStartDate: form.statusStartDate,
          statusEndDate: form.statusEndDate.trim() ? form.statusEndDate : null,
          comment: form.comment.trim() ? form.comment : null,
          modifiedBy: user.username,
          correlationId,
        });
        pushToast({ type: "success", title: "Status log entry updated" });
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
        key: "status",
        header: "Status",
        render: (r) => {
          const id = r.statusCodeId !== null && r.statusCodeId !== undefined ? String(r.statusCodeId) : "";
          const s = id ? statusCodeIndex.get(id) : undefined;
          return (
            <div>
              <div className="text-sm font-semibold">{s?.statusDescription ?? s?.statusCode ?? "Unknown"}</div>
              <div className="muted text-xs">StatusCodeId: <span className="font-mono">{id || "-"}</span></div>
            </div>
          );
        },
      },
      { key: "start", header: "From", render: (r) => <span className="text-sm">{r.statusStartDate ?? "-"}</span> },
      { key: "end", header: "To", render: (r) => <span className="text-sm">{r.statusEndDate ?? "-"}</span> },
      { key: "comment", header: "Comment", render: (r) => <span className="text-sm">{r.comment ?? "-"}</span> },
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
    [caps.canEdit, statusCodeIndex],
  );

  if (shouldShowAuthRequired(error)) {
    return <AuthRequiredPanel title="Status Log" />;
  }

  return (
    <div className="space-y-4">
      <TabStatePanel
        title="Status Log"
        description="BRD-required status log module for the asset."
        loading={loading}
        error={error}
        isEmpty={!loading && !error && rows.length === 0}
        emptyTitle="No status log entries"
        emptyMessage="No status log entries were found for this asset."
      >
        <div className="space-y-4">
          <CrudActionBar
            title="Status Log"
            description="Manage operating status over time (chronology validated by backend)."
            caps={caps}
            canCreate={caps.canCreate}
            onCreate={openCreate}
            createLabel="Create Status Entry"
          />

          <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.assetStatusLogId} emptyLabel="No status log entries." />
        </div>
      </TabStatePanel>

      <Modal
        open={modalOpen}
        title={editing ? "Edit Status Log Entry" : "Create Status Log Entry"}
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
            <div className="label">Operating Status</div>
            <select
              className="input mt-1"
              value={form.statusCodeId}
              onChange={(e) => setForm((s) => ({ ...s, statusCodeId: e.target.value }))}
            >
              <option value="">Select…</option>
              {statusCodes.map((s) => (
                <option key={s.statusCodeId} value={s.statusCodeId}>
                  {s.statusCode ? `${s.statusCode} — ` : ""}{s.statusDescription || s.statusCodeId}
                </option>
              ))}
            </select>
            {fieldErrors.statusCodeId ? <div className="mt-1 text-sm text-red-600">{fieldErrors.statusCodeId}</div> : null}
          </label>

          <FormInput
            label="Status From Date"
            value={form.statusStartDate}
            onChange={(v) => setForm((s) => ({ ...s, statusStartDate: v }))}
            error={fieldErrors.statusStartDate}
            placeholder="YYYY-MM-DD"
          />

          <FormInput
            label="Status To Date (optional)"
            value={form.statusEndDate}
            onChange={(v) => setForm((s) => ({ ...s, statusEndDate: v }))}
            error={fieldErrors.statusEndDate}
            placeholder="YYYY-MM-DD"
          />

          <FormInput
            label="Comments (optional)"
            value={form.comment}
            onChange={(v) => setForm((s) => ({ ...s, comment: v }))}
            error={fieldErrors.comment}
          />
        </div>
      </Modal>
    </div>
  );
}
